import path from "path";
import { Command } from "./definitions/configuration.interface";
import { SemanticContext } from "./definitions/semantic-context.interface";
import { yaml } from "./yaml";
import fs from "fs";
import { PartialDeep } from "type-fest";

let context: PartialDeep<SemanticContext> = {
  logger: { log: jest.fn(), error: jest.fn() },
  options: {},
  nextRelease: {
    version: "1.0.0",
  },
  lastRelease: {
    version: "0.9.0",
  },
};

beforeEach(() => {
  fs.writeFileSync("./__test.yaml", "version: 0.9.0\n");
});

afterEach(() => {
  fs.unlinkSync("./__test.yaml");
});

it("should successfully update version number", () => {
  const command: Command = {
    cwd: ".",
    file: "./__test.yaml",
    selector: "version",
    value: "${nextRelease.version}",
  };

  yaml(command, context as any);

  expect(fs.readFileSync("./__test.yaml", "utf8")).toEqual("version: 1.0.0\n");
});

it("preserves comments in a yaml file", () => {
  fs.writeFileSync("./__test.yaml", "# comment\nversion: 0.9.0\n");

  const command: Command = {
    cwd: ".",
    file: "./__test.yaml",
    selector: "version",
    value: "${nextRelease.version}",
  };

  yaml(command, context as any);
  const result = fs.readFileSync("./__test.yaml", "utf8");

  expect(result).toEqual("# comment\nversion: 1.0.0\n");
});
