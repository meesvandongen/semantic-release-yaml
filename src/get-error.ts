import SemanticReleaseError from "@semantic-release/error";
import isString from "lodash/isString";
import { inspect } from "util";
import { Command } from "./definitions/configuration.interface";
import pkg from "../package.json";

const [homepage] = pkg.homepage.split("#");

function stringify(object: unknown) {
  if (isString(object)) {
    return object;
  }
  return inspect(object, {
    breakLength: Infinity,
    depth: 2,
    maxArrayLength: 5,
  });
}

function linkify(file: string) {
  return `${homepage}/blob/master/${file}`;
}

export function getError(key: keyof Command, command: Command): Error {
  const message = [
    `for usage, see ${linkify("README.md#options")}`,
    "",
    `Your configuration for the \`${key}\` option is \`${stringify(
      command[key]
    )}\`.`,
  ].join("\n");
  return new SemanticReleaseError(`Invalid \`${key}\` option.`, key, message);
}
