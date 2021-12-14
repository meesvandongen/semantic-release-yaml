import { Command } from "./definitions/configuration.interface";
import { SemanticContext } from "./definitions/semantic-context.interface";
export declare const yaml: (command: Command, { cwd, env, stdout, stderr, logger, ...context }: SemanticContext) => void;
