const git = require('nodegit');
import {exec} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {exit} from 'process';
import {spinner} from './utility';

const {spawn} = require('child_process');

/**
 * Project class
 */
export class Project {
  log: Function;
  name: string;
  deploy: {provider: string; token:string; };
  themeName: string;
  themePath: string;
  type: string;
  private dir: string;
  private readonly repo: string;

  /**
   * Project init
   * @param {string} name
   * @param {string} type
   * @param {string} themePath
   * @param {string} themeName
   * @param {string} repo
   * @param {object} deploy
   * @param {function} logFn
   */
  constructor(
    name: string,
    type: string,
    themePath: string,
    themeName: string,
    repo: string,
    deploy: {provider: string; token:string; },
    logFn: Function,
  ) {
    this.name = name;
    this.type = type;
    this.themePath = themePath;
    this.themeName = themeName;
    this.repo = repo;
    this.deploy = deploy;
    this.dir = `${process.cwd()}/${name}`;
    this.log = logFn;
  }

  /**
   * Start up project generation
   */
  public async generatProject() {
    try {
      spinner('start', `# Setting writable dir`);
      this.setWriteableDir();
      spinner('stop', `DONE`);

      spinner('start', `# Fetching ${this.repo} and writing to ${this.dir}`);
      await this.fetchRepo();
      spinner('stop', `DONE`);

      spinner('start', `# Installing dependencies for ${this.name}`);
      await this.installDependencies();
      spinner('stop', `DONE`);

      spinner('start', `# Applying theme: ${this.themePath}`);
      await this.applyTheme();
      spinner('stop', `DONE`);

      spinner('start', `# Applying Environment variables: ${this.themePath}`);
      this.applyEnvVars();
      spinner('stop', `DONE`);

      spinner('start', `# Deploying to ${this.deploy.provider}`);
      await this.deployProject();
      spinner('stop', 'DONE \n You can check the above url to see the generated project live!');
    } catch (error) {
      this.triggerCliError((error as Error).message);
    }
  }

  /**
   * Deploy project with selected deployment
   * @protected
   */
  protected async deployProject(): Promise<void> {
    const {token, provider} = this.deploy;
    if (provider === 'none') {
      return;
    }
    if (provider === 'vercel') {
      return new Promise((resolve, reject)=> {
        if (token === '') {
          reject(new Error('No Vercel token set'));
        }

        let error = '';
        const cliDir = process.cwd();
        process.chdir(this.dir);
        const vercelCmds = exec(
          `npm i vercel && vercel --token ${token} --confirm`
        );
        vercelCmds.stdout.on('data', (data) => {
          this.log(data.toString());
        });
        vercelCmds.stderr.on('data', (data) => {
          error = data.toString();
        });
        vercelCmds.on('close', (code) => {
          process.chdir(cliDir);
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(error));
          }
        });
      });
    }
  }
  /**
   * Adds a .env file (that the boilerplates use) which contains the following:
   * PROJECT_TYPE
   * PROJECT_THEME
   */
  protected applyEnvVars(): void {
    const type = `PROJECT_TYPE=${this.type}`;
    const theme = `PROJECT_THEME=${this.themeName}`;

    fs.writeFileSync(`${this.dir}/.env`, `${type}\n${theme}`);
  }

  /**
   * Makes a copy of the selected css file and moves (& renames)
   * it to the project dir
   * @protected
   */
  protected async applyTheme(): Promise<void> {
    fs.copyFileSync(this.themePath, `${this.themePath}-copy`);
    return fs.rename(
      `${this.themePath}-copy`,
      path.resolve(this.dir, 'style.css'),
      (err) => {
        if (err) {
          throw err;
        }
      },
    );
  }

  /**
   * Fetches the repo that is set through "new Project" (this.repo)
   */
  protected async fetchRepo(): Promise<void> {
    // eslint-disable-next-line new-cap
    await git.Clone(this.repo, this.dir);
  }

  /**
   * Installs the dependencies in the project dir
   * (only if there is package.json present)
   */
  protected async installDependencies(): Promise<void> {
    const cliDir = process.cwd();
    const packageJsonFile = path.resolve(this.dir, 'package.json');

    if (fs.existsSync(packageJsonFile)) {
      process.chdir(this.dir);
      return new Promise((resolve, reject) => {
        const npmInstall = spawn('npm', ['i']);
        npmInstall.stderr.on('data', (data: Buffer) => {
          throw new Error(data.toString());
        });
        npmInstall.on('close', (code: number) => {
          process.chdir(cliDir); // reset the cwd to the cli dir
          if (code == 0) {
            resolve();
          } else {
            reject(new Error('Unknown error during dependency' +
              ' installation...'));
          }
        });
      });
    }
  }

  /**
   * Tries to get a writeable dir
   * If Dir is not empty, create same dir with a suffix like: (xx-2, xx-3)
   * If xx-10 is reached, then it stops trying
   */
  protected setWriteableDir(): void {
    if (fs.existsSync(this.dir)) {
      let memDir = this.dir;
      let suffix = 1;
      do {
        memDir = `${this.dir}-${suffix}`;
        suffix++;
      } while (suffix <= 10 && fs.existsSync(memDir));
      if (fs.existsSync(memDir)) {
        throw new Error(
          `No suitable directory has been found for ${this.name}`,
        );
      }
      this.dir = memDir;
    }
  }

  /**
   *  Show error & exit
   * @param {string} msg
   * @param {number} code
   * @protected
   */
  protected triggerCliError(msg: string, code?: number): void {
    this.log(msg);
    exit(code ? code : 1);
  }
}
