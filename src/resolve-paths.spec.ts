import { describe, expect, it } from "vite-plus/test";
import { resolvePaths } from "./resolve-paths";

describe("selectors without a wildcard", () => {
  it("resolves a single key", () => {
    expect(resolvePaths({ version: "1" }, "version")).toEqual([["version"]]);
  });

  it("resolves dot and bracket notation like lodash", () => {
    expect(resolvePaths({}, "a.b[0].c")).toEqual([["a", "b", "0", "c"]]);
    expect(resolvePaths({}, "a['b.c']")).toEqual([["a", "b.c"]]);
  });

  it("resolves paths that do not exist yet, so they can be created", () => {
    expect(resolvePaths({}, "missing.nested.key")).toEqual([
      ["missing", "nested", "key"],
    ]);
  });
});

describe("selectors with a wildcard", () => {
  const document = {
    modules: [
      { name: "abc", properties: { VERSION: null } },
      { name: "xyz", properties: { VERSION: "0.1.0" } },
    ],
  };

  it("matches every item of a sequence (bracket notation)", () => {
    expect(resolvePaths(document, "modules[*].properties.VERSION")).toEqual([
      ["modules", "0", "properties", "VERSION"],
      ["modules", "1", "properties", "VERSION"],
    ]);
  });

  it("matches every item of a sequence (dot notation)", () => {
    expect(resolvePaths(document, "modules.*.properties.VERSION")).toEqual([
      ["modules", "0", "properties", "VERSION"],
      ["modules", "1", "properties", "VERSION"],
    ]);
  });

  it("matches every key of a mapping", () => {
    const services = { services: { api: { tag: "1" }, web: { tag: "1" } } };

    expect(resolvePaths(services, "services.*.tag")).toEqual([
      ["services", "api", "tag"],
      ["services", "web", "tag"],
    ]);
  });

  it("matches at the root of the document", () => {
    expect(resolvePaths({ a: { v: 1 }, b: { v: 2 } }, "*.v")).toEqual([
      ["a", "v"],
      ["b", "v"],
    ]);
  });

  it("matches every item when the wildcard is the last segment", () => {
    expect(resolvePaths({ list: [1, 2, 3] }, "list[*]")).toEqual([
      ["list", "0"],
      ["list", "1"],
      ["list", "2"],
    ]);
    expect(resolvePaths({ map: { a: 1, b: 2 } }, "map.*")).toEqual([
      ["map", "a"],
      ["map", "b"],
    ]);
  });

  it("supports multiple wildcards", () => {
    const matrix = {
      groups: [
        { items: [{ v: 1 }, { v: 2 }] },
        { items: [{ v: 3 }] },
        { items: [] },
      ],
    };

    expect(resolvePaths(matrix, "groups[*].items[*].v")).toEqual([
      ["groups", "0", "items", "0", "v"],
      ["groups", "0", "items", "1", "v"],
      ["groups", "1", "items", "0", "v"],
    ]);
  });

  it("creates the final key of a mapping when it is missing", () => {
    const partial = { modules: [{ properties: {} }, { properties: { V: 1 } }] };

    expect(resolvePaths(partial, "modules[*].properties.V")).toEqual([
      ["modules", "0", "properties", "V"],
      ["modules", "1", "properties", "V"],
    ]);
  });

  it("skips matches whose parents do not exist", () => {
    const partial = {
      modules: [
        { name: "no properties" },
        { properties: { VERSION: null } },
        { properties: null },
        { properties: "a string" },
      ],
    };

    expect(resolvePaths(partial, "modules[*].properties.VERSION")).toEqual([
      ["modules", "1", "properties", "VERSION"],
    ]);
  });

  it("skips matches that are not a mapping or sequence", () => {
    const mixed = { list: [{ v: 1 }, "scalar", 42, null, [{ v: 2 }]] };

    expect(resolvePaths(mixed, "list[*].v")).toEqual([["list", "0", "v"]]);
  });

  it("does not treat dates as mappings", () => {
    const dates = { items: [new Date(0), { at: 1 }] };

    expect(resolvePaths(dates, "items[*].at")).toEqual([["items", "1", "at"]]);
  });

  it("only matches existing indexes of a sequence after a wildcard", () => {
    const rows = { rows: [[1, 2], [3]] };

    expect(resolvePaths(rows, "rows[*][1]")).toEqual([["rows", "0", "1"]]);
  });

  it("does not set named keys on a sequence after a wildcard", () => {
    const rows = { rows: [[1, 2], { name: "x" }] };

    expect(resolvePaths(rows, "rows[*].name")).toEqual([["rows", "1", "name"]]);
  });

  it("returns nothing when the wildcard has nothing to match", () => {
    expect(resolvePaths({ modules: [] }, "modules[*].v")).toEqual([]);
    expect(resolvePaths({ modules: {} }, "modules.*.v")).toEqual([]);
    expect(resolvePaths({}, "modules[*].v")).toEqual([]);
    expect(resolvePaths({ modules: "scalar" }, "modules[*].v")).toEqual([]);
  });

  it("returns nothing for a document that is not a mapping or sequence", () => {
    expect(resolvePaths(null, "*.v")).toEqual([]);
    expect(resolvePaths("scalar", "*.v")).toEqual([]);
  });

  it("does not walk into inherited properties", () => {
    const modules = { modules: [{ name: "abc" }] };

    expect(resolvePaths(modules, "modules[*].constructor.name")).toEqual([]);
    expect(resolvePaths(modules, "modules[*].__proto__.polluted")).toEqual([]);
  });

  it("does not modify the document", () => {
    const original = JSON.parse(JSON.stringify(document));

    resolvePaths(document, "modules[*].properties.NEW");

    expect(document).toEqual(original);
  });
});
