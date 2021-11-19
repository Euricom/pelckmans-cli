import cli from "cli-ux";
import * as inquirer from "inquirer";
import { kill } from "process";

const inquiry = async <T>(
  varName: string,
  promptMsg: string,
  choices: any[]
): Promise<T> => {
  return inquirer.prompt([
    {
      name: varName,
      message: promptMsg,
      type: "list",
      choices,
    },
  ]);
};

const spinner = (action: "stop" | "start", msg: string) => {
  if (action === "start") {
    cli.action[action](msg, "", {
      stdout: true,
    });
  }
  if (action === "stop") {
    cli.action.stop(msg);
  }
};

export { spinner, inquiry };
