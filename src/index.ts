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
    other: "https://github.com/PsySolix/demo-boilerplate",
  };
  protected themes: IOption = {
    default: "./styles/default.css",
    minimal: "./styles/minimal.css",
  };

  async run() {
    // Get projectName
    const name = await cli.prompt("What is the project name?");
    // Get projectType
    const { type }: { type: string } = await inquiry(
      "type",
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
      name.toLowerCase(),
      type.toLowerCase(),
      this.themes[theme],
      this.boilerplates[type],
      this.log
    );

    await project.init();

    // this.log(`Generated project ${JSON.stringify(project)} \n`);

    // Deployment
    const { deploy }: { deploy: string } = await inquiry(
      "deploy",
      "Select a deployment target:",
      ["vercel", "none"]
    );
  }
}

export = PelckmansCli;
