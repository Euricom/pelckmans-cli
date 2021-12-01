import {Command, flags} from '@oclif/command';
import {Project} from './project';
import {choose, input} from './utility';
import * as path from 'path';

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
    nextjs: 'https://github.com/Euricom/pelckmans-boilerplate-nextjs',
    other: 'https://github.com/PsySolix/demo-boilerplate',
  };
  protected themes: IOption = {
    default: `${path.resolve(__dirname, '../styles/default.css')}`,
    minimal: `${path.resolve(__dirname, '../styles/minimal.css')}`,
  };

  /**
   * Main after calling /bin/run
   */
  async run() {
    const {args} = this.parse(PelckmansCli);
    const name = args.name === '' ? 'unknown-project' : args.name;
    let token = '';

    // Get projectType
    const {type}: { type: string } = await choose(
      'type',
      'Select a project type',
      Object.keys(this.boilerplates).map((key) => ({
        name: key,
      })),
    );

    // Get theme
    const {theme}: { theme: string } = await choose(
      'theme',
      'Select a theme',
      Object.keys(this.themes).map((key) => ({
        name: key,
      })),
    );

    // Deployment;
    const {deploy}: { deploy: string } = await choose(
      'deploy',
      'Select a deployment target:',
      ['vercel', 'none'],
    );

    if (deploy === 'vercel') {
      const {vercelToken} = await input(
        'vercelToken',
        'Add a Vercel token (--token) that will be used for the deployment',
        true);
      token = vercelToken;
    }

    // Generate project
    const project = new Project(
      name.toLowerCase(),
      type.toLowerCase(),
      this.themes[theme], // ThemePath
      theme, // ThemeName
      this.boilerplates[type], // Repo
      {provider: deploy, token},
      this.log,
    );

    const projectDir = await project.generateProject();

    this.log(`\n\n${name} created! To get the project running locally:\n`);
    this.log(`cd ${projectDir} && npm run dev`);
  }
}

export = PelckmansCli;
