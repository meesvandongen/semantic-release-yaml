import { expect, it } from "vite-plus/test";
import { Command } from "./definitions/configuration.interface";
import { getError } from "./get-error";

const command: Command = {
  cwd: ".",
  file: "./Chart.yaml",
  selector: "version",
  value: "${nextRelease.version}",
};

it("creates a semantic-release error for the option", () => {
  const error = getError("file", command) as any;

  expect(error.semanticRelease).toBe(true);
  expect(error.code).toBe("file");
  expect(error.message).toBe("Invalid `file` option.");
});

it("links to the documentation", () => {
  const error = getError("file", command) as any;

  expect(error.details).toContain(
    "https://github.com/meesvandongen/semantic-release-yaml/blob/master/README.md#options"
  );
});

it("includes a string value as is", () => {
  const error = getError("file", command) as any;

  expect(error.details).toContain(
    "Your configuration for the `file` option is `./Chart.yaml`."
  );
});

it("includes a non-string value in a readable form", () => {
  const error = getError("selector", {
    ...command,
    selector: ["a", "b"],
  }) as any;

  expect(error.details).toContain(
    "Your configuration for the `selector` option is `[ 'a', 'b' ]`."
  );
});

it("includes a missing value", () => {
  const error = getError("value", {
    ...command,
    value: undefined,
  } as unknown as Command) as any;

  expect(error.details).toContain(
    "Your configuration for the `value` option is `undefined`."
  );
});
