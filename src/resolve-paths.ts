import isPlainObject from "lodash/isPlainObject";
import toPath from "lodash/toPath";

export const WILDCARD = "*";

type Container = Record<string, unknown> | Array<unknown>;

const isContainer = (value: unknown): value is Container =>
  Array.isArray(value) || isPlainObject(value);

const hasOwn = (node: Container, key: string) =>
  Object.prototype.hasOwnProperty.call(node, key);

/**
 * The keys of `node` that `segment` matches. Only the final segment of a
 * selector may introduce a new key, and only on a mapping: a sequence never
 * grows, so a match can not leave holes in it.
 */
function matchKeys(node: Container, segment: string, isLast: boolean) {
  if (segment === WILDCARD) {
    return Object.keys(node);
  }
  if (hasOwn(node, segment) || (isLast && !Array.isArray(node))) {
    return [segment];
  }
  return [];
}

/**
 * Resolves a selector to the concrete paths that should be set in `document`.
 *
 * A selector without wildcards resolves to its own path, so it behaves exactly
 * like lodash's `set` (missing parents are created).
 *
 * A `*` segment matches every existing item of a sequence or key of a mapping.
 * For selectors with a wildcard nothing is created except the final key of a
 * mapping: every parent along the way must already exist, otherwise that match
 * is skipped.
 */
export function resolvePaths(
  document: unknown,
  selector: string
): Array<Array<string>> {
  const segments = toPath(selector);

  if (!segments.includes(WILDCARD)) {
    return [segments];
  }

  const paths: Array<Array<string>> = [];

  const walk = (node: unknown, index: number, prefix: Array<string>) => {
    if (!isContainer(node)) {
      return;
    }

    const isLast = index === segments.length - 1;

    matchKeys(node, segments[index], isLast).forEach((key) => {
      const path = [...prefix, key];
      if (isLast) {
        paths.push(path);
      } else {
        walk((node as Record<string, unknown>)[key], index + 1, path);
      }
    });
  };

  walk(document, 0, []);

  return paths;
}
