import { Command } from "./definitions/configuration.interface";
import { isNil } from "lodash";
import { isString } from "lodash";
import AggregateError from "aggregate-error";
import { getError } from "./get-error";

const isNonEmptyString = (value: unknown) =>
  isString(value) && value.trim().length > 0;

const isOptional =
  (validator: (value: unknown) => boolean) => (value: unknown) =>
    isNil(value) || validator(value);

interface Validator {
  key: keyof Command;
  validator: (value: unknown) => boolean;
}
const validators: Array<Validator> = [
  { key: "cwd", validator: isOptional(isNonEmptyString) },
  { key: "file", validator: isNonEmptyString },
  { key: "phase", validator: isNonEmptyString },
  { key: "selector", validator: isNonEmptyString },
  { key: "value", validator: isNonEmptyString },
];

export function verifyCommands(commands: Array<Command>) {
  const errors = commands.flatMap((command) =>
    validators.reduce((errors, { key, validator }) => {
      const value = command[key];

      if (!validator(value)) {
        return errors.concat(getError(key, command));
      }
      return errors;
    }, [] as Array<Error>)
  );

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
}
