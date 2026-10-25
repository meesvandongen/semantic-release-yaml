import path from "path";
import template from "lodash/template";
import fs from "fs";
import { Command } from "./definitions/configuration.interface";
import { SemanticContext } from "./definitions/semantic-context.interface";
import castArray from "lodash/castArray";
import set from "lodash/set";
import { yamlDiffPatch } from "yaml-diff-patch";
import jsYaml from "js-yaml";
import { resolvePaths } from "./resolve-paths";

export const yaml = (
  command: Command,
  { cwd = process.cwd(), env, logger, ...context }: SemanticContext
) => {
  const interpretedCwd = template(command.cwd)(context);
  const interpretedFile = template(command.file)(context);
  const interpretedSelectors = castArray(command.selector).map((selector) =>
    template(selector)(context)
  );
  const interpretedValue = template(command.value)(context);

  const workingDirectory = interpretedCwd
    ? path.resolve(cwd, interpretedCwd)
    : cwd;
  const pathToFile = path.resolve(workingDirectory, interpretedFile);

  logger.log(
    `Updating -> path: ${pathToFile} | selector: ${interpretedSelectors.join(", ")} | value: ${interpretedValue}`
  );

  const yamlFileRaw = fs.readFileSync(pathToFile, "utf8");
  const originalYamlFile = jsYaml.load(yamlFileRaw);
  const changedYamlFile = jsYaml.load(yamlFileRaw);

  if (typeof changedYamlFile !== "object" || changedYamlFile === null) {
    throw new Error(`The file ${pathToFile} is not a valid YAML file.`);
  }

  interpretedSelectors.forEach((selector) => {
    const paths = resolvePaths(changedYamlFile, selector);

    if (paths.length === 0) {
      logger.warn(
        `The selector ${selector} did not match anything in ${pathToFile}.`
      );
    }

    paths.forEach((keys) => set(changedYamlFile, keys, interpretedValue));
  });

  const yamlResult = yamlDiffPatch(
    yamlFileRaw,
    originalYamlFile,
    changedYamlFile
  );

  fs.writeFileSync(pathToFile, yamlResult);
};
