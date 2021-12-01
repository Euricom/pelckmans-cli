import cli from 'cli-ux';
import * as inquirer from 'inquirer';

const choose = async <T>(
  varName: string,
  promptMsg: string,
  choices: any[],
): Promise<T> => {
  return inquirer.prompt([
    {
      name: varName,
      message: promptMsg,
      type: 'list',
      choices,
    },
  ]);
};
const input = async <T>(
  varName: string,
  promptMsg: string,
  secure?: boolean
) : Promise<T> => {
  return inquirer.prompt([
    {
      name: varName,
      message: promptMsg,
      type: secure ? 'password' : 'input',
    },
  ]);
};

const spinner = (action: 'stop' | 'start', msg: string) => {
  if (action === 'start') {
    cli.action[action](msg, '', {
      stdout: true,
    });
  }
  if (action === 'stop') {
    cli.action.stop(msg);
  }
};

export {spinner, choose, input};
