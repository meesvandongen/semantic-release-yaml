import path from "path";
import template from "lodash/template";
import fs from "fs";
import { Command } from "./definitions/configuration.interface";
import { SemanticContext } from "./definitions/semantic-context.interface";
import set from "lodash/set";
import { yamlDiffPatch } from "yaml-diff-patch";
import jsYaml from "js-yaml";

export const yaml = (
  command: Command,
  { cwd = process.cwd(), env, logger, ...context }: SemanticContext
) => {
  const interpretedCwd = template(command.cwd)(context);
  const interpretedFile = template(command.file)(context);
  const interpretedSelector = template(command.selector)(context);
  const interpretedValue = template(command.value)(context);

  const workingDirectory = interpretedCwd
    ? path.resolve(cwd, interpretedCwd)
    : cwd;
  const pathToFile = path.resolve(workingDirectory, interpretedFile);

  logger.log(
    `Updating -> path: ${pathToFile} | selector: ${interpretedSelector} | value: ${interpretedValue}`
  );

  const yamlFileRaw = fs.readFileSync(pathToFile, "utf8");
  const originalYamlFile = jsYaml.load(yamlFileRaw);
  const changedYamlFile = jsYaml.load(yamlFileRaw);

  if (typeof changedYamlFile !== "object" || changedYamlFile === null) {
    throw new Error(`The file ${pathToFile} is not a valid YAML file.`);
  }

  set(changedYamlFile, interpretedSelector, interpretedValue);
  const yamlResult = yamlDiffPatch(
    yamlFileRaw,
    originalYamlFile,
    changedYamlFile
  );

  fs.writeFileSync(pathToFile, yamlResult);
};
