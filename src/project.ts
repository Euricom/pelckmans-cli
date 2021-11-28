// has no default export
import {exec} from 'child_process';

const git = require('nodegit');
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
  deploy: string;
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
   * @param {string} deploy
   * @param {function} logFn
   */
  constructor(
    name: string,
    type: string,
    themePath: string,
    themeName: string,
    repo: string,
    deploy: string,
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
  public async init() {
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

      spinner('start', `# Deploying with ${this.deploy}`);
      await this.deployProject();
      spinner('stop', 'DONE');
    } catch (error) {
      this.triggerCliError((error as Error).message);
    }
  }

  /**
   * Deploy project with selected deployment
   * @protected
   */
  protected async deployProject(): Promise<void> {
    if (this.deploy === 'none') {
      return;
    }
    if (this.deploy === 'vercel') {
      const cliDir = process.cwd();
      process.chdir(this.dir);
      return new Promise((resolve, reject)=> {
        let error = '';
        const vercelCmds = exec('npm i vercel && vercel');
        vercelCmds.stdout.on('data', (data) => {
          this.log(data.toString());
        });
        vercelCmds.stderr.on('data', (data) => {
          error = data.toString();
        });
        vercelCmds.on('close', (code) => {
          if (code === 0) {
            resolve();
          }
          reject(new Error(error));
        });
        process.chdir(cliDir);
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
            const err = new Error('Unknown error during dependency' +
              ' installation...');
            reject(err);
            throw new Error('Unknown error during dependency installation...');
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
