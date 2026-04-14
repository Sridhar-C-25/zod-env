import { defineConfig } from "tsup";

export default defineConfig([
  // Library
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
    sourcemap: false,
    splitting: false,
    treeshake: true,
  },
  // CLI
  {
    entry: { cli: "src/cli.ts" },
    format: ["cjs"],
    dts: false,
    sourcemap: false,
    splitting: false,
    banner: { js: "#!/usr/bin/env node" },
  },
]);
