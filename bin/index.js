#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const project_1 = require("./project");
const utility_1 = require("./utility");
const path = require("path");
/**
 * Generate a project by supplying a name
 */
class PelckmansCli extends command_1.Command {
    constructor() {
        super(...arguments);
        this.boilerplates = {
            nextjs: 'https://github.com/Euricom/pelckmans-boilerplate-nextjs',
            other: 'https://github.com/PsySolix/demo-boilerplate',
        };
        this.themes = {
            default: `${path.resolve(__dirname, '../styles/default.css')}`,
            minimal: `${path.resolve(__dirname, '../styles/minimal.css')}`,
        };
    }
    /**
     * Main after calling /bin/run
     */
    async run() {
        const { args } = this.parse(PelckmansCli);
        const name = args.name === '' ? 'unknown-project' : args.name;
        let token = '';
        // Get projectType
        const { type } = await (0, utility_1.choose)('type', 'Select a project type', Object.keys(this.boilerplates).map((key) => ({
            name: key,
        })));
        // Get theme
        const { theme } = await (0, utility_1.choose)('theme', 'Select a theme', Object.keys(this.themes).map((key) => ({
            name: key,
        })));
        // Deployment;
        const { deploy } = await (0, utility_1.choose)('deploy', 'Select a deployment target:', ['vercel', 'none']);
        if (deploy === 'vercel') {
            const { vercelToken } = await (0, utility_1.input)('vercelToken', 'Add a Vercel token (--token) that will be used for the deployment', true);
            token = vercelToken;
        }
        // Generate project
        const project = new project_1.Project(name.toLowerCase(), type.toLowerCase(), this.themes[theme], // ThemePath
        theme, // ThemeName
        this.boilerplates[type], // Repo
        { provider: deploy, token }, this.log);
        const projectDir = await project.generateProject();
        this.log(`\n\n${name} created! To get the project running locally:\n`);
        this.log(`cd ${projectDir} && npm run dev`);
    }
}
PelckmansCli.args = [{ name: 'name' }];
PelckmansCli.description = 'Generate a static site (and deploy it to Netlify)';
PelckmansCli.flags = {
    version: command_1.flags.version({ char: 'v' }),
    help: command_1.flags.help({ char: 'h' }),
};
PelckmansCli.strict = false;
PelckmansCli.run()
    .then(() => { }, (require('@oclif/errors/handle')));
