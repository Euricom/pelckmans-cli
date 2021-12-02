# pelckmans-cli

Pelckmans CLI for generating static websites with netlify backend
[![License](https://img.shields.io/npm/l/pelckmans-cli.svg)](https://github.com/Euricom/pelckmans-cli/blob/master/package.json)

Bootstrap an app for Pelckmans.

## Usage

You'll need the following installed to use Pelckmans CLI:

- [Node.js][7] (>=12)

To create a new app using Pelckmans, simply run the following command:

```sh
npx @euricom/pelckmans-cli <project-name> && cd <project-name>
```

This will walk you through creating a project, allowing you to choose which
template and preferences you want to use.

### Show help

```sh
npx @euricom/pelckmans-cli  --help
```

### Templates

The default mode of the Pelckmans CLI is to use a template. Each template has
different options that can be chosen to configure the initial project to suit
your needs.

Current templates include:

- Nextjs (Next.js)
- Default (Simple website)
