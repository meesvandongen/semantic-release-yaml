import fs from "fs";
import os from "os";
import path from "path";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { Command } from "./definitions/configuration.interface";
import { SemanticContext } from "./definitions/semantic-context.interface";
import { yaml } from "./yaml";

let directory: string;
let context: SemanticContext;

function createContext(cwd: string) {
  return {
    cwd,
    env: {},
    logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn(), success: vi.fn() },
    options: {},
    branch: { name: "main" },
    nextRelease: { version: "1.0.0", channel: "next" },
    lastRelease: { version: "0.9.0" },
  } as unknown as SemanticContext;
}

const write = (file: string, content: string) => {
  const target = path.join(directory, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};

const read = (file: string) =>
  fs.readFileSync(path.join(directory, file), "utf8");

const command = (overrides: Partial<Command> = {}): Command => ({
  cwd: ".",
  file: "./test.yaml",
  selector: "version",
  value: "${nextRelease.version}",
  ...overrides,
});

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "semantic-release-yaml-"));
  context = createContext(directory);
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

describe("updating a field", () => {
  it("updates a top level field", () => {
    write("test.yaml", "version: 0.9.0\n");

    yaml(command(), context);

    expect(read("test.yaml")).toBe("version: 1.0.0\n");
  });

  it("updates a nested field", () => {
    write("test.yaml", "meta:\n  version: 0.9.0\n  name: app\n");

    yaml(command({ selector: "meta.version" }), context);

    expect(read("test.yaml")).toBe("meta:\n  version: 1.0.0\n  name: app\n");
  });

  it("updates an item of a sequence by index", () => {
    write("test.yaml", "list:\n  - 0.9.0\n  - keep\n");

    yaml(command({ selector: "list[0]" }), context);

    expect(read("test.yaml")).toBe("list:\n  - 1.0.0\n  - keep\n");
  });

  it("updates a field in an item of a sequence", () => {
    write("test.yaml", "modules:\n  - name: a\n    version: 0.9.0\n");

    yaml(command({ selector: "modules[0].version" }), context);

    expect(read("test.yaml")).toBe(
      "modules:\n  - name: a\n    version: 1.0.0\n"
    );
  });

  it("updates a key that contains a dot", () => {
    write("test.yaml", "labels:\n  app.version: 0.9.0\n");

    yaml(command({ selector: "labels['app.version']" }), context);

    expect(read("test.yaml")).toBe("labels:\n  app.version: 1.0.0\n");
  });

  it("creates a field that does not exist yet", () => {
    write("test.yaml", "name: app\n");

    yaml(command({ selector: "meta.version" }), context);

    expect(read("test.yaml")).toBe("name: app\nmeta:\n  version: 1.0.0\n");
  });

  it("replaces an empty value", () => {
    write("test.yaml", "version:\n");

    yaml(command(), context);

    expect(read("test.yaml")).toBe("version: 1.0.0\n");
  });

  it("keeps a value that looks like a number a string", () => {
    write("test.yaml", "version: '1'\n");

    yaml(command({ value: "2" }), context);

    expect(read("test.yaml")).toBe('version: "2"\n');
  });

  it("leaves the rest of the file untouched", () => {
    const rest = "name: app\nlist:\n  - a\n  - b\nnested:\n  deep:\n    x: 1\n";
    write("test.yaml", `version: 0.9.0\n${rest}`);

    yaml(command(), context);

    expect(read("test.yaml")).toBe(`version: 1.0.0\n${rest}`);
  });
});

describe("comments", () => {
  it("preserves comments in a yaml file", () => {
    write("test.yaml", "# comment\nversion: 0.9.0\n");

    yaml(command(), context);

    expect(read("test.yaml")).toBe("# comment\nversion: 1.0.0\n");
  });

  it("preserves inline comments and comments between items", () => {
    write(
      "test.yaml",
      [
        "# header",
        "modules:",
        "  # first",
        "  - name: a # name of a",
        "    version: 0.9.0",
        "  # second",
        "  - name: b",
        "    version: 0.9.0",
        "",
      ].join("\n")
    );

    yaml(command({ selector: "modules[*].version" }), context);

    expect(read("test.yaml")).toBe(
      [
        "# header",
        "modules:",
        "  # first",
        "  - name: a # name of a",
        "    version: 1.0.0",
        "  # second",
        "  - name: b",
        "    version: 1.0.0",
        "",
      ].join("\n")
    );
  });
});

describe("wildcards", () => {
  // The example from https://github.com/meesvandongen/semantic-release-yaml/issues/5
  const mta = [
    "modules:",
    "  - name: moduleABC",
    "    properties:",
    "      VERSION:",
    "  - name: moduleXYZ",
    "    properties:",
    "      VERSION:",
    "",
  ].join("\n");

  it("updates the field in every item of a sequence", () => {
    write("mta.yaml", mta);

    yaml(
      command({ file: "mta.yaml", selector: "modules[*].properties.VERSION" }),
      context
    );

    expect(read("mta.yaml")).toBe(
      [
        "modules:",
        "  - name: moduleABC",
        "    properties:",
        "      VERSION: 1.0.0",
        "  - name: moduleXYZ",
        "    properties:",
        "      VERSION: 1.0.0",
        "",
      ].join("\n")
    );
  });

  it("supports dot notation", () => {
    write("mta.yaml", mta);

    yaml(
      command({ file: "mta.yaml", selector: "modules.*.properties.VERSION" }),
      context
    );

    expect(read("mta.yaml")).not.toContain("VERSION:\n");
    expect(read("mta.yaml").match(/VERSION: 1\.0\.0/g)).toHaveLength(2);
  });

  it("updates the field in every value of a mapping", () => {
    write(
      "test.yaml",
      "services:\n  api:\n    tag: 0.9.0\n  web:\n    tag: 0.9.0\n"
    );

    yaml(command({ selector: "services.*.tag" }), context);

    expect(read("test.yaml")).toBe(
      "services:\n  api:\n    tag: 1.0.0\n  web:\n    tag: 1.0.0\n"
    );
  });

  it("updates every item when the wildcard is the last segment", () => {
    write("test.yaml", "versions:\n  - 0.1.0\n  - 0.2.0\n");

    yaml(command({ selector: "versions[*]" }), context);

    expect(read("test.yaml")).toBe("versions:\n  - 1.0.0\n  - 1.0.0\n");
  });

  it("supports multiple wildcards", () => {
    write(
      "test.yaml",
      [
        "groups:",
        "  - items:",
        "      - v: 0",
        "      - v: 0",
        "  - items:",
        "      - v: 0",
        "",
      ].join("\n")
    );

    yaml(command({ selector: "groups[*].items[*].v" }), context);

    expect(read("test.yaml").match(/v: 1\.0\.0/g)).toHaveLength(3);
    expect(read("test.yaml")).not.toContain("v: 0");
  });

  it("does not add items to a sequence", () => {
    write("mta.yaml", mta);

    yaml(
      command({ file: "mta.yaml", selector: "modules[*].properties.VERSION" }),
      context
    );

    expect(read("mta.yaml").match(/- name:/g)).toHaveLength(2);
  });

  it("skips items that do not have the parent of the field", () => {
    const content = [
      "modules:",
      "  - name: withProperties",
      "    properties:",
      "      VERSION:",
      "  - name: withoutProperties",
      "",
    ].join("\n");
    write("test.yaml", content);

    yaml(command({ selector: "modules[*].properties.VERSION" }), context);

    expect(read("test.yaml")).toBe(
      content.replace("VERSION:", "VERSION: 1.0.0")
    );
  });

  it("adds the field to items that have its parent", () => {
    write(
      "test.yaml",
      "modules:\n  - properties:\n      OTHER: x\n  - properties:\n      VERSION:\n"
    );

    yaml(command({ selector: "modules[*].properties.VERSION" }), context);

    expect(read("test.yaml")).toBe(
      "modules:\n  - properties:\n      OTHER: x\n      VERSION: 1.0.0\n  - properties:\n      VERSION: 1.0.0\n"
    );
  });

  it("warns and leaves the file untouched when nothing matches", () => {
    const content = "# comment\nmodules: []\n";
    write("test.yaml", content);

    yaml(command({ selector: "modules[*].version" }), context);

    expect(read("test.yaml")).toBe(content);
    expect(context.logger.warn).toHaveBeenCalledWith(
      `The selector modules[*].version did not match anything in ${path.join(
        directory,
        "test.yaml"
      )}.`
    );
  });

  it("does not warn when the selector matches", () => {
    write("mta.yaml", mta);

    yaml(
      command({ file: "mta.yaml", selector: "modules[*].properties.VERSION" }),
      context
    );

    expect(context.logger.warn).not.toHaveBeenCalled();
  });
});

describe("multiple selectors", () => {
  it("updates every selector", () => {
    write("test.yaml", "version: 0.9.0\nappVersion: 0.9.0\nname: app\n");

    yaml(command({ selector: ["version", "appVersion"] }), context);

    expect(read("test.yaml")).toBe(
      "version: 1.0.0\nappVersion: 1.0.0\nname: app\n"
    );
  });

  it("combines plain and wildcard selectors", () => {
    write(
      "test.yaml",
      "version: 0.9.0\nmodules:\n  - version: 0.9.0\n  - version: 0.9.0\n"
    );

    yaml(command({ selector: ["version", "modules[*].version"] }), context);

    expect(read("test.yaml")).toBe(
      "version: 1.0.0\nmodules:\n  - version: 1.0.0\n  - version: 1.0.0\n"
    );
  });

  it("warns only for the selectors that do not match", () => {
    write("test.yaml", "version: 0.9.0\n");

    yaml(command({ selector: ["version", "modules[*].version"] }), context);

    expect(read("test.yaml")).toBe("version: 1.0.0\n");
    expect(context.logger.warn).toHaveBeenCalledTimes(1);
    expect(context.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("modules[*].version")
    );
  });

  it("accepts a single selector in an array", () => {
    write("test.yaml", "version: 0.9.0\n");

    yaml(command({ selector: ["version"] }), context);

    expect(read("test.yaml")).toBe("version: 1.0.0\n");
  });
});

describe("templates", () => {
  it("evaluates the value", () => {
    write("test.yaml", "version: x\n");

    yaml(
      command({ value: "${lastRelease.version}->${nextRelease.version}" }),
      context
    );

    expect(read("test.yaml")).toBe("version: 0.9.0->1.0.0\n");
  });

  it("evaluates a static value", () => {
    write("test.yaml", "version: x\n");

    yaml(command({ value: "static" }), context);

    expect(read("test.yaml")).toBe("version: static\n");
  });

  it("evaluates the file name", () => {
    write("main.yaml", "version: 0.9.0\n");

    yaml(command({ file: "./${branch.name}.yaml" }), context);

    expect(read("main.yaml")).toBe("version: 1.0.0\n");
  });

  it("evaluates the selector", () => {
    write("test.yaml", "channels:\n  next: 0.9.0\n  latest: 0.9.0\n");

    yaml(command({ selector: "channels.${nextRelease.channel}" }), context);

    expect(read("test.yaml")).toBe(
      "channels:\n  next: 1.0.0\n  latest: 0.9.0\n"
    );
  });

  it("evaluates every selector of an array", () => {
    write("test.yaml", "next: 0.9.0\nmain: 0.9.0\nother: 0.9.0\n");

    yaml(
      command({ selector: ["${nextRelease.channel}", "${branch.name}"] }),
      context
    );

    expect(read("test.yaml")).toBe("next: 1.0.0\nmain: 1.0.0\nother: 0.9.0\n");
  });

  it("evaluates the cwd", () => {
    write("main/test.yaml", "version: 0.9.0\n");

    yaml(command({ cwd: "./${branch.name}" }), context);

    expect(read("main/test.yaml")).toBe("version: 1.0.0\n");
  });
});

describe("resolving the file", () => {
  it("resolves the file relative to the semantic-release cwd", () => {
    write("test.yaml", "version: 0.9.0\n");

    yaml(command({ cwd: undefined }), context);

    expect(read("test.yaml")).toBe("version: 1.0.0\n");
  });

  it("resolves the file relative to the command cwd", () => {
    write("charts/app/Chart.yaml", "version: 0.9.0\n");

    yaml(command({ cwd: "charts/app", file: "Chart.yaml" }), context);

    expect(read("charts/app/Chart.yaml")).toBe("version: 1.0.0\n");
  });

  it("supports an absolute file path", () => {
    write("test.yaml", "version: 0.9.0\n");

    yaml(command({ file: path.join(directory, "test.yaml") }), context);

    expect(read("test.yaml")).toBe("version: 1.0.0\n");
  });

  it("logs what it updates", () => {
    write("test.yaml", "version: 0.9.0\n");

    yaml(command({ selector: ["version", "modules[*].v"] }), context);

    expect(context.logger.log).toHaveBeenCalledWith(
      `Updating -> path: ${path.join(
        directory,
        "test.yaml"
      )} | selector: version, modules[*].v | value: 1.0.0`
    );
  });
});

describe("errors", () => {
  it("throws when the file does not exist", () => {
    expect(() => yaml(command({ file: "missing.yaml" }), context)).toThrow(
      /ENOENT/
    );
  });

  it.each([
    ["a scalar", "just a string\n"],
    ["empty", ""],
    ["null", "~\n"],
  ])("throws when the file is %s", (_, content) => {
    write("test.yaml", content);

    expect(() => yaml(command(), context)).toThrow(
      `The file ${path.join(directory, "test.yaml")} is not a valid YAML file.`
    );
    expect(read("test.yaml")).toBe(content);
  });

  it("throws when the file can not be parsed", () => {
    const content = "version: [unclosed\n";
    write("test.yaml", content);

    expect(() => yaml(command(), context)).toThrow();
    expect(read("test.yaml")).toBe(content);
  });
});
