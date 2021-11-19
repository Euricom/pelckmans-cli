import { Command, flags } from "@oclif/command";
import cli from "cli-ux";
import { Project } from "./project.class";
import { inquiry } from "./utility";

interface IOption {
  [key: string]: string;
}

class PelckmansCli extends Command {
  static description = "Generate a static site and deploy it to Netlify ";
  static strict = false;

  // TODO: read from json file
  protected boilerplates: IOption = {
    memoria: "https://github.com/PsySolix/memoria-boilerplate",
    demo: "https://github.com/PsySolix/demo-boilerplate",
  };
  protected themes: IOption = {
    minimal: "./styles/minimal.css",
    default: "./styles/default.css",
  };

  async run() {
    // Get projectName
    const projectName = await cli.prompt("What is the project name?");
    // Get projectType
    const { projectType }: any = await inquiry(
      "projectType",
      "Select a project type",
      Object.keys(this.boilerplates).map((key) => ({
        name: key,
      }))
    );

    // Get theme
    const { theme }: { theme: string } = await inquiry(
      "theme",
      "Select a theme",
      Object.keys(this.themes).map((key) => ({
        name: key,
      }))
    );

    // Generate project
    const project = new Project(
      projectName.toLowerCase(),
      projectType.toLowerCase(),
      theme.toLowerCase(),
      this.boilerplates[projectType]
    );

    await project.init();

    this.log(`Generated project ${JSON.stringify(project)} \n`);
  }
}

export = PelckmansCli;
