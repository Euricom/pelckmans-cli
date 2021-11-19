// has no default export

const git = require("nodegit");
import * as fs from "fs";
import * as path from "path";
import { spinner } from "./utility";

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
    await this.applyTheme();
  }

  // If Dir is not empty, create same dir with a suffix like: (xx-2, xx-3)
  protected setWriteableDir(): void {
    if (fs.existsSync(this.dir)) {
      let memDir = this.dir;
      let suffix = 1;
      do {
        memDir = `${this.dir}-${suffix}`;
        suffix++;
      } while (fs.existsSync(memDir));
      this.dir = memDir;
    }
  }

  protected async fetchFromGit() {
    spinner("start", `Fetching ${this.repo} and writing to ${this.dir}`);
    await git.Clone(this.repo, this.dir);
    spinner("stop", `DONE \n`);
  }

  protected async applyTheme() {
    spinner("start", `Applying theme: ${this.theme}`);
    try {
      fs.copyFileSync(this.theme, `${this.theme}-copy`);
    } catch (error) {}
    return fs.rename(
      `${this.theme}-copy`,
      path.resolve(this.dir, "style.css"),
      (err) => {
        if (!err) {
          spinner("stop", `DONE \n`);
        } else {
          this.logger(err);
          throw err;
        }
      }
    );
  }
}
