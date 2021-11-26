// has no default export
const git = require("nodegit");
import * as fs from "fs";
import * as path from "path";
import { exit } from "process";
import { spinner } from "./utility";

const { spawn } = require("child_process");

export class Project {
  name: string;
  type: string;
  themePath: string;
  themeName: string;
  logger: Function;
  private repo: string;
  private dir: string;

  constructor(
    name: string,
    type: string,
    themePath: string,
    themeName: string,
    repo: string,
    logFn: Function
  ) {
    this.name = name;
    this.type = type;
    this.themePath = themePath;
    this.themeName = themeName;
    this.repo = repo;
    this.dir = `./__PROJECTS__/${name}`;
    this.logger = logFn;
  }

  public async init() {
    try {
      this.setWriteableDir();
      await this.fetchRepo();
      await this.installDependancies();
      this.applyEnvVars();
    } catch (error) {
      this.triggerCliError((error as Error).message);
    }
    //await this.applyTheme();
  }

  /**
   * Adds a .env file (that the boilerplates use) which contains the following:
   * PROJECT_TYPE
   * PROJECT_THEME
   */
  protected applyEnvVars(): void {
    const type = `PROJECT_TYPE=${this.type}`;
    const theme = `PROJECT_THEME=${this.themeName}`;

    this.logger(`Writing to ${this.dir}`);
    try {
      fs.writeFileSync(`${this.dir}/.env`, `${type}\n${theme}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Show error & exit
   * @param msg Error message
   * @param code Error code
   */
  protected triggerCliError(msg: string, code?: number) {
    this.logger(msg);
    exit(code ? code : 1);
  }

  /**
   * Tries to get a writeable dir
   * If Dir is not empty, create same dir with a suffix like: (xx-2, xx-3)
   * If xx-10 is reached, then it stops trying
   */
  protected setWriteableDir(): void {
    try {
      if (fs.existsSync(this.dir)) {
        let memDir = this.dir;
        let suffix = 1;
        do {
          memDir = `${this.dir}-${suffix}`;
          suffix++;
        } while (suffix <= 10 && fs.existsSync(memDir));
        this.dir = memDir;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Installs the dependencies in the project dir (only if there is package.json present)
   * @returns Promise to resolve when close event is returned on spawn cmd
   */
  protected async installDependancies(): Promise<void> {
    const cliDir = process.cwd();
    const packageJsonFile = path.resolve(this.dir, "package.json");
    try {
      if (fs.existsSync(packageJsonFile)) {
        process.chdir(this.dir);
        this.logger(`Package.json file exists ${packageJsonFile}`);
        this.logger(`Installing dependancies`);

        return new Promise((resolve, reject) => {
          const npmInstall = spawn("npm", ["i"]);
          npmInstall.stdout.setEncoding("utf8");
          npmInstall.stdout.on("data", (chunk: Buffer) => {
            this.logger(chunk.toString());
          });
          npmInstall.stderr.on("data", (data: Buffer) => {
            this.logger(` error : ${data.toString()}`);
            throw new Error(data.toString());
          });
          npmInstall.on("close", (code: number) => {
            process.chdir(cliDir); // reset the cwd to the cli dir
            if (code == 0) {
              resolve();
            } else {
              reject();
              throw new Error(
                "Unknown error during dependency installation..."
              );
            }
          });
        });
      }
    } catch (error) {
      throw error;
    }
  }
  /**
   * Fetches the repo that is set through "new Project" (this.repo)
   */
  protected async fetchRepo() {
    spinner("start", `Fetching ${this.repo} and writing to ${this.dir}`);
    try {
      await git.Clone(this.repo, this.dir);
    } catch (error) {
      throw error;
    }
    spinner("stop", `DONE \n`);
  }

  // TODO handle loading css files correctly in project
  /**
   * Makes a copy of the selected css file and moves (& renames) it to the project dir
   * @returns Promise
   */
  protected async applyTheme() {
    spinner("start", `Applying theme: ${this.themePath}`);
    try {
      fs.copyFileSync(this.themePath, `${this.themePath}-copy`);
    } catch (error) {
      throw error;
    }
    return fs.rename(
      `${this.themePath}-copy`,
      path.resolve(this.dir, "style.css"),
      (err) => {
        if (!err) {
          spinner("stop", `DONE \n`);
        } else {
          this.triggerCliError(err.message);
        }
      }
    );
  }
}
