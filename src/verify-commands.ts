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

const VALIDATORS: {
  [key in keyof Command]: (value: unknown) => boolean;
} = {
  cwd: isOptional(isNonEmptyString),
  file: isNonEmptyString,
  phase: isNonEmptyString,
  selector: isNonEmptyString,
  template: isNonEmptyString,
};

export function verifyCommands(commands: Array<Command>) {
  const errors = commands.flatMap((command) =>
    Object.keys(VALIDATORS).reduce((errors, key) => {
      const validator = VALIDATORS[key];
      const value = command[key];

      if (!validator(value)) {
        return errors.concat(getError(key, command));
      }
      return errors;
    }, [])
  );

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
}
