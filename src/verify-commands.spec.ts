import { describe, expect, it } from "vite-plus/test";
import { Command } from "./definitions/configuration.interface";
import { verifyCommands } from "./verify-commands";

const valid: Command = {
  cwd: ".",
  file: "./Chart.yaml",
  selector: "version",
  value: "${nextRelease.version}",
};

/** The `code` of every error thrown by `verifyCommands`. */
function errorCodes(commands: Array<unknown>): Array<string> {
  try {
    verifyCommands(commands as Array<Command>);
  } catch (error) {
    return [...(error as Iterable<{ code: string }>)].map(({ code }) => code);
  }
  return [];
}

describe("verifyCommands", () => {
  it("accepts a valid command", () => {
    expect(() => verifyCommands([valid])).not.toThrow();
  });

  it("accepts no commands", () => {
    expect(() => verifyCommands([])).not.toThrow();
  });

  it("accepts a command without cwd", () => {
    expect(errorCodes([{ ...valid, cwd: undefined }])).toEqual([]);
    expect(errorCodes([{ ...valid, cwd: null }])).toEqual([]);
  });

  it("accepts a wildcard selector", () => {
    expect(
      errorCodes([{ ...valid, selector: "modules[*].properties.VERSION" }])
    ).toEqual([]);
  });

  it("accepts an array of selectors", () => {
    expect(errorCodes([{ ...valid, selector: ["a", "b[*].c"] }])).toEqual([]);
    expect(errorCodes([{ ...valid, selector: ["a"] }])).toEqual([]);
  });

  it.each([
    ["missing", undefined],
    ["null", null],
    ["an empty string", ""],
    ["only whitespace", "   "],
    ["a number", 1],
    ["an object", { path: "version" }],
    ["an empty array", []],
    ["an array with an empty string", ["version", ""]],
    ["an array with a non-string", ["version", 1]],
    ["a nested array", [["version"]]],
  ])("rejects a selector that is %s", (_, selector) => {
    expect(errorCodes([{ ...valid, selector }])).toEqual(["selector"]);
  });

  it.each([
    ["missing", undefined],
    ["an empty string", ""],
    ["a number", 1],
    ["an array", ["./Chart.yaml"]],
  ])("rejects a file that is %s", (_, file) => {
    expect(errorCodes([{ ...valid, file }])).toEqual(["file"]);
  });

  it.each([
    ["missing", undefined],
    ["an empty string", ""],
    ["a number", 1],
  ])("rejects a value that is %s", (_, value) => {
    expect(errorCodes([{ ...valid, value }])).toEqual(["value"]);
  });

  it.each([
    ["an empty string", ""],
    ["a number", 1],
  ])("rejects a cwd that is %s", (_, cwd) => {
    expect(errorCodes([{ ...valid, cwd }])).toEqual(["cwd"]);
  });

  it("reports every invalid option of every command", () => {
    expect(
      errorCodes([
        { ...valid, file: "", value: "" },
        valid,
        { ...valid, selector: [] },
      ])
    ).toEqual(["file", "value", "selector"]);
  });

  it("throws semantic-release errors that explain the problem", () => {
    expect.assertions(4);
    try {
      verifyCommands([{ ...valid, selector: "" }]);
    } catch (error) {
      const [first] = [...(error as Iterable<any>)];
      expect(first.semanticRelease).toBe(true);
      expect(first.code).toBe("selector");
      expect(first.message).toBe("Invalid `selector` option.");
      expect(first.details).toContain("README.md#options");
    }
  });
});
