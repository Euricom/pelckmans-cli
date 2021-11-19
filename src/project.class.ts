// has no default export
const git = require("nodegit");
import { spinner } from "./utility";

export class Project {
  name: string;
  type: string;
  theme: string;
  private repo: string;
  private dir: string;

  constructor(name: string, type: string, theme: string, repo: string) {
    this.name = name;
    this.type = type;
    this.theme = theme;
    this.repo = repo;
    this.dir = `./__PROJECTS__/${name}`;
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

    spinner("stop", `DONE \n`);
  }
}
