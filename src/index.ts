import { yaml } from "./yaml";
import { verifyCommands } from "./verify-commands";
import { Configuration } from "./definitions/configuration.interface";
import { SemanticContext } from "./definitions/semantic-context.interface";

export function prepare({ commands }: Configuration, context: SemanticContext) {
  if (commands.length > 0) {
    verifyCommands(commands);

    commands.forEach((command) => {
      yaml(command, context);
    });
    return "Prepared";
  }
}
