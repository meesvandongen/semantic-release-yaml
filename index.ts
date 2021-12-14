import { yaml } from "./lib/yaml";
import { verifyCommands } from "./lib/verify-commands";
import { Configuration } from "./lib/definitions/configuration.interface";
import { SemanticContext } from "./lib/definitions/semantic-context.interface";

export function prepare(pluginConfig: Configuration, context: SemanticContext) {
  const commands = pluginConfig.commands.filter(command => command.phase === "prepare");

  if (commands.length > 0) {
    verifyCommands(commands);

    commands.forEach(command => {
      yaml(command, context);
    });
    return "Prepared";
  }
}
