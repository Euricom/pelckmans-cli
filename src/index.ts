import {Command, flags} from '@oclif/command';
import {Project} from './project';
import {inquiry} from './utility';

interface IOption {
  [key: string]: string;
}

/**
 * Generate a project by supplying a name
 */
class PelckmansCli extends Command {
  static args = [{name: 'name'}];
  static description = 'Generate a static site (and deploy it to Netlify)';
  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
  };
  static strict = false;
  protected boilerplates: IOption = {
    nextjs: 'https://github.com/PsySolix/next-boilerplate',
    memoria: 'https://github.com/PsySolix/memoria-boilerplate',
    other: 'https://github.com/PsySolix/demo-boilerplate',
  };
  protected themes: IOption = {
    default: './styles/default.css',
    minimal: './styles/minimal.css',
  };

  /**
   * Main after calling /bin/run
   */
  async run() {
    const {args} = this.parse(PelckmansCli);
    const name = args.name === '' ? 'unknown-project' : args.name;

    // Get projectType
    const {type}: { type: string } = await inquiry(
      'type',
      'Select a project type',
      Object.keys(this.boilerplates).map((key) => ({
        name: key,
      })),
    );

    // Get theme
    const {theme}: { theme: string } = await inquiry(
      'theme',
      'Select a theme',
      Object.keys(this.themes).map((key) => ({
        name: key,
      })),
    );

    // Deployment;
    const {deploy}: { deploy: string } = await inquiry(
      'deploy',
      'Select a deployment target:',
      ['vercel', 'none'],
    );

    // Generate project
    const project = new Project(
      name.toLowerCase(),
      type.toLowerCase(),
      this.themes[theme], // ThemePath
      theme, // ThemeName
      this.boilerplates[type], // Repo
      deploy,
      this.log,
    );

    await project.generatProject();
  }
}

export = PelckmansCli;
