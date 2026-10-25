import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { SemanticContext } from "./definitions/semantic-context.interface";
import { prepare } from "./index";

let directory: string;
let context: SemanticContext;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "semantic-release-yaml-"));
  context = {
    cwd: directory,
    env: {},
    logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn(), success: vi.fn() },
    nextRelease: { version: "1.0.0" },
  } as unknown as SemanticContext;
  fs.writeFileSync(path.join(directory, "a.yaml"), "version: 0.9.0\n");
  fs.writeFileSync(path.join(directory, "b.yaml"), "version: 0.9.0\n");
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

const read = (file: string) =>
  fs.readFileSync(path.join(directory, file), "utf8");

it("does nothing without commands", () => {
  expect(prepare({ commands: [] }, context)).toBeUndefined();
  expect(context.logger.log).not.toHaveBeenCalled();
});

it("runs every command", () => {
  const result = prepare(
    {
      commands: [
        { cwd: ".", file: "a.yaml", selector: "version", value: "1.0.0" },
        { cwd: ".", file: "b.yaml", selector: "name", value: "b" },
      ],
    },
    context
  );

  expect(result).toBe("Prepared");
  expect(read("a.yaml")).toBe("version: 1.0.0\n");
  expect(read("b.yaml")).toBe("version: 0.9.0\nname: b\n");
});

it("runs commands on the same file in order", () => {
  prepare(
    {
      commands: [
        { cwd: ".", file: "a.yaml", selector: "version", value: "first" },
        { cwd: ".", file: "a.yaml", selector: "version", value: "second" },
      ],
    },
    context
  );

  expect(read("a.yaml")).toBe("version: second\n");
});

it("verifies every command before changing any file", () => {
  expect(() =>
    prepare(
      {
        commands: [
          { cwd: ".", file: "a.yaml", selector: "version", value: "1.0.0" },
          { cwd: ".", file: "b.yaml", selector: "", value: "1.0.0" },
        ],
      },
      context
    )
  ).toThrow();

  expect(read("a.yaml")).toBe("version: 0.9.0\n");
  expect(read("b.yaml")).toBe("version: 0.9.0\n");
});
