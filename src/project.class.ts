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
    await this.fetchFromGit();
    await this.applyTheme();
  }

  protected async fetchFromGit() {
    spinner("start", `Fetching ${this.repo} from Git`);
    await git.Clone(this.repo, this.dir);
    spinner("stop", `DONE \n`);
  }

  protected async applyTheme() {
    spinner("start", `Applying theme: ${this.theme}`);
    return fs.rename(
      this.theme,
      path.resolve(this.dir, "styles.css"),
      (err) => {
        if (!err) {
          spinner("stop", `DONE \n`);
        } else {
          this.logger(err);
        }
      }
    );
  }
}
