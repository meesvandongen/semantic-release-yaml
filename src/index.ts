import { yaml } from "./yaml";
import { verifyCommands } from "./verify-commands";
import { Configuration } from "./definitions/configuration.interface";
import { SemanticContext } from "./definitions/semantic-context.interface";
import template from "lodash/template";

export function prepare(pluginConfig: Configuration, context: SemanticContext) {
  const commands = pluginConfig.commands.filter((command) => {
    const phase = template(command.phase)(context);
    return phase === "prepare";
  });

  if (commands.length > 0) {
    verifyCommands(commands);

    commands.forEach((command) => {
      yaml(command, context);
    });
    return "Prepared";
  }
}
