import { Command, flags } from "@oclif/command";
import cli from "cli-ux";
import * as inquirer from "inquirer";

// has no default export
const git = require("nodegit");

interface IOption {
  [key: string]: string;
}

class PelckmansCli extends Command {
  static description = "Generate a static site and deploy it to Netlify ";
  static strict = false;

  // TODO: read from json file
  protected projects: IOption = {
    memoria: "https://github.com/PsySolix/memoria-boilerplate",
    demo: "https://github.com/PsySolix/demo-boilerplate",
  };
  protected themes: IOption = {
    minimal: "./styles/minimal.css",
    default: "./styles/default.css",
  };

  protected spinner(action: "stop" | "start", msg: string) {
    if (action === "start") {
      cli.action[action](msg, "", {
        stdout: true,
      });
    }
    if (action === "stop") {
      cli.action.stop(msg);
    }
  }
  protected async generateProject(options: {
    project: string;
    theme: string;
    tenant: string;
  }) {
    const { project, theme, tenant } = options;
    const projectRepo = this.projects[project];
    const projectDir = `./__PROJECTS__/${tenant}`;

    // Fetch from Git
    this.spinner("start", `Fetching ${projectRepo} from Git`);
    await git.Clone(projectRepo, projectDir);
    this.spinner("stop", `DONE`);

    this.log(`Generated project ${tenant} in ${projectDir}`);

    this.spinner("start", `Applying theme: ${theme}`);
    this.spinner("stop", `DONE`);
  }

  async run() {
    // Get ProjectName
    const projectName = await cli.prompt("What is the project name?");
    // Get ProjectType
    const { projectType }: { projectType: string } = await inquirer.prompt([
      {
        name: "projectType",
        message: "Select a project type",
        type: "list",
        choices: Object.keys(this.projects).map((key) => ({
          name: key,
        })),
      },
    ]);

    // Set theme
    const { theme }: { theme: string } = await inquirer.prompt([
      {
        name: "theme",
        message: "Select a theme",
        type: "list",
        choices: Object.keys(this.themes).map((key) => ({
          name: key,
        })),
      },
    ]);

    this.generateProject({
      project: projectType.toLowerCase(),
      theme: theme.toLowerCase(),
      tenant: projectName.toLowerCase(),
    });
  }
}

export = PelckmansCli;
