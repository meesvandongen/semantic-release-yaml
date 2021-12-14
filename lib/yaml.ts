import path from "path";
import template from "lodash/template";
import jsYaml from "js-yaml";
import fs from "fs";
import { Command } from "./definitions/configuration.interface";
import { SemanticContext } from "./definitions/semantic-context.interface";
import set from "lodash/set";

export const yaml = (command: Command, { cwd, env, stdout, stderr, logger, ...context }: SemanticContext) => {
  const newValue = template(command.template)(context);

  logger.log("Call script %s", newValue);

  const workingDirectory = command.cwd ? path.resolve(cwd, command.cwd) : cwd;
  const pathToFile = path.resolve(workingDirectory, command.file);

  const yamlFile = jsYaml.load(fs.readFileSync(pathToFile, "utf8"));

  if (typeof yamlFile !== "object") {
    throw new Error(`The file ${pathToFile} is not a valid YAML file.`);
  }
  set(yamlFile, command.selector, newValue);

  fs.writeFileSync(pathToFile, jsYaml.dump(yamlFile));
};
