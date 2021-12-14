import SemanticReleaseError from "@semantic-release/error";
import { Command } from "./definitions/configuration.interface";
export declare function getError(commandKey: string, command: Command): SemanticReleaseError;
