import { build } from "esbuild";

await build({
  entryPoints: ["src/routes/charters.lifecycle.test.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: ".test-build/charters.lifecycle.test.cjs",
  sourcemap: "inline",
  external: ["*.node"],
});