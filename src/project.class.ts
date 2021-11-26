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
  theme: string;
  logger: Function;
  private repo: string;
  private dir: string;

  constructor(
    name: string,
    type: string,
    theme: string,
    repo: string,
    logFn: Function
  ) {
    this.name = name;
    this.type = type;
    this.theme = theme;
    this.repo = repo;
    this.dir = `./__PROJECTS__/${name}`;
    this.logger = logFn;
  }

  public async init() {
    this.setWriteableDir();
    await this.fetchFromGit();
    await this.installDependancies();
    this.applyEnvVars();
    //await this.applyTheme();
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
    if (fs.existsSync(this.dir)) {
      let memDir = this.dir;
      let suffix = 1;
      do {
        memDir = `${this.dir}-${suffix}`;
        suffix++;
      } while (suffix <= 10 && fs.existsSync(memDir));
      this.dir = memDir;
    }
  }

  /**
   * Installs the dependencies in the project dir (only if there is package.json present)
   * @returns Promise to resolve when close event is returned on spawn cmd
   */
  protected async installDependancies(): Promise<void> {
    const cliDir = process.cwd();
    const packageJsonFile = path.resolve(this.dir, "package.json");

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
        });
        npmInstall.on("close", (code: number) => {
          process.chdir(cliDir); // reset the cwd to the cli dir
          if (code == 0) {
            resolve();
          } else {
            reject();
            this.triggerCliError("Error during dependency installation");
          }
        });
      });
    }
  }
  /**
   * Fetches the repo that is set through "new Project" (this.repo)
   */
  protected async fetchFromGit() {
    spinner("start", `Fetching ${this.repo} and writing to ${this.dir}`);
    await git.Clone(this.repo, this.dir);
    spinner("stop", `DONE \n`);
  }

  // TODO handle loading css files correctly in project
  /**
   * Makes a copy of the selected css file and moves (& renames) it to the project dir
   * @returns Promise
   */
  protected async applyTheme() {
    spinner("start", `Applying theme: ${this.theme}`);
    try {
      fs.copyFileSync(this.theme, `${this.theme}-copy`);
    } catch (error) {
      this.triggerCliError((error as Error).message);
    }
    return fs.rename(
      `${this.theme}-copy`,
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
