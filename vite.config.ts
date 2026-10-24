import { defineConfig } from "vite-plus";

export default defineConfig({
  // Mirrors the previous .prettierrc (Prettier 2 defaults).
  fmt: {
    printWidth: 80,
    trailingComma: "es5",
    sortPackageJson: false,
    ignorePatterns: ["dist/**", "coverage/**", "CHANGELOG.md", "renovate.json"],
  },
  lint: {
    ignorePatterns: ["dist/**", "coverage/**"],
  },
  // Was: microbundle --target=node --format cjs --compress (output: package.json "main").
  pack: {
    entry: ["src/index.ts"],
    format: "cjs",
    platform: "node",
    target: "node16",
    minify: true,
    sourcemap: true,
    dts: true,
    // Keep the published file name dist/index.js.
    fixedExtension: false,
  },
  test: {
    clearMocks: true,
  },
});
