import SemanticReleaseError from "@semantic-release/error";
import isString from "lodash/isString";
import { inspect } from "util";
import { Command } from "./definitions/configuration.interface";

const pkg = require("../../package.json");

const [homepage] = pkg.homepage.split("#");
const stringify = (object) =>
  isString(object)
    ? object
    : inspect(object, { breakLength: Infinity, depth: 2, maxArrayLength: 5 });
const linkify = (file) => `${homepage}/blob/master/${file}`;

const errors = {
  cmd: (command: Command) => ({
    message: `Invalid \`cmd\` option for phase \`${command.phase}\`.`,
    details: `The [\`cmd\` option](${linkify(
      `README.md#options`
    )}) is required and must be a non empty \`String\`.

Your configuration for the \`cmd\` option is \`${stringify(
      command.template
    )}\`.`,
  }),
  cwd: (command: Command) => ({
    message: "Invalid `cwd` option.",
    details: `The [\`cwd\` option](${linkify(
      "README.md#options"
    )}) if defined, must be a non empty \`String\`.

Your configuration for the \`cwd\` option is \`${stringify(command.cwd)}\`.`,
  }),
};

export function getError(
  commandKey: string,
  command: Command
): SemanticReleaseError {
  const { message, details } = errors[commandKey](command);
  return new SemanticReleaseError(message, commandKey, details);
}
