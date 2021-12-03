#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const git = require('nodegit');
const fs = require("fs");
const path = require("path");
const process_1 = require("process");
const utility_1 = require("./utility");
const { spawn } = require('child_process');
/**
 * Project class
 */
class Project {
    /**
     * Project init
     * @param {string} name
     * @param {string} type
     * @param {string} themePath
     * @param {string} themeName
     * @param {string} repo
     * @param {object} deploy
     * @param {function} logFn
     */
    constructor(name, type, themePath, themeName, repo, deploy, logFn) {
        this.name = name;
        this.type = type;
        this.themePath = themePath;
        this.themeName = themeName;
        this.repo = repo;
        this.deploy = deploy;
        this.dir = `${process.cwd()}/${name}`;
        this.log = logFn;
    }
    /**
     * Start up project generation
     */
    async generateProject() {
        try {
            (0, utility_1.spinner)('start', `# Setting writable dir`);
            this.setWriteableDir();
            (0, utility_1.spinner)('stop', `DONE`);
            (0, utility_1.spinner)('start', `# Fetching ${this.repo} and writing to ${this.dir}`);
            await this.fetchRepo();
            (0, utility_1.spinner)('stop', `DONE`);
            (0, utility_1.spinner)('start', `# Installing dependencies for ${this.name}`);
            await this.installDependencies();
            (0, utility_1.spinner)('stop', `DONE`);
            (0, utility_1.spinner)('start', `# Applying theme: ${this.themePath}`);
            await this.applyTheme();
            (0, utility_1.spinner)('stop', `DONE`);
            (0, utility_1.spinner)('start', `# Applying Environment variables`);
            this.applyEnvVars();
            (0, utility_1.spinner)('stop', `DONE`);
            return this.dir;
        }
        catch (error) {
            this.triggerCliError(error.message);
        }
    }
    /**
     * Adds a .env file (that the boilerplates use) which contains the following:
     * PROJECT_TYPE
     * PROJECT_THEME
     * PROJECT_DEPLOY_TOKEN
     * PROJECT_DEPLOY_PROVIDER
     */
    applyEnvVars() {
        fs.writeFileSync(`${this.dir}/.env`, `PROJECT_TYPE=${this.type}\n` +
            `PROJECT_THEME=${this.themeName}\n` +
            `PROJECT_DEPLOY_TOKEN=${this.deploy.token}\n` +
            `PROJECT_DEPLOY_PROVIDER=${this.deploy.provider}\n`);
    }
    /**
     * Makes a copy of the selected css file and moves (& renames)
     * it to the project dir
     * @protected
     */
    async applyTheme() {
        fs.copyFileSync(this.themePath, `${this.themePath}-copy`);
        return fs.rename(`${this.themePath}-copy`, path.resolve(this.dir, 'theme.css'), (err) => {
            if (err) {
                throw err;
            }
        });
    }
    /**
     * Fetches the repo that is set through "new Project" (this.repo)
     */
    async fetchRepo() {
        // eslint-disable-next-line new-cap
        await git.Clone(this.repo, this.dir);
    }
    /**
     * Installs the dependencies in the project dir
     * (only if there is package.json present)
     */
    async installDependencies() {
        const cliDir = process.cwd();
        const packageJsonFile = path.resolve(this.dir, 'package.json');
        if (fs.existsSync(packageJsonFile)) {
            process.chdir(this.dir);
            return new Promise((resolve, reject) => {
                const npmInstall = spawn('npm', ['i', '--loglevel=error']);
                npmInstall.stderr.on('data', (data) => {
                    throw new Error(data.toString());
                });
                npmInstall.on('close', (code) => {
                    process.chdir(cliDir); // reset the cwd to the cli dir
                    if (code == 0) {
                        resolve();
                    }
                    else {
                        reject(new Error('Unknown error during dependency' +
                            ' installation...'));
                    }
                });
            });
        }
    }
    /**
     * Tries to get a writeable dir
     * If Dir is not empty, create same dir with a suffix like: (xx-2, xx-3)
     * If xx-10 is reached, then it stops trying
     */
    setWriteableDir() {
        if (fs.existsSync(this.dir)) {
            let memDir = this.dir;
            let suffix = 1;
            do {
                memDir = `${this.dir}-${suffix}`;
                suffix++;
            } while (suffix <= 10 && fs.existsSync(memDir));
            if (fs.existsSync(memDir)) {
                throw new Error(`No suitable directory has been found for ${this.name}`);
            }
            this.dir = memDir;
        }
    }
    /**
     *  Show error & exit
     * @param {string} msg
     * @param {number} code
     * @protected
     */
    triggerCliError(msg, code) {
        this.log(msg);
        (0, process_1.exit)(code ? code : 1);
    }
}
exports.Project = Project;
