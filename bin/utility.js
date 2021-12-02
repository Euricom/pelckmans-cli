#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.input = exports.choose = exports.spinner = void 0;
const cli_ux_1 = require("cli-ux");
const inquirer = require("inquirer");
const choose = async (varName, promptMsg, choices) => {
    return inquirer.prompt([
        {
            name: varName,
            message: promptMsg,
            type: 'list',
            choices,
        },
    ]);
};
exports.choose = choose;
const input = async (varName, promptMsg, secure) => {
    return inquirer.prompt([
        {
            name: varName,
            message: promptMsg,
            type: secure ? 'password' : 'input',
        },
    ]);
};
exports.input = input;
const spinner = (action, msg) => {
    if (action === 'start') {
        cli_ux_1.default.action[action](msg, '', {
            stdout: true,
        });
    }
    if (action === 'stop') {
        cli_ux_1.default.action.stop(msg);
    }
};
exports.spinner = spinner;
