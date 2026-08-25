import { build } from "esbuild";

for (const [entryPoint, outfile] of [
  ["src/routes/charters.lifecycle.test.ts", ".test-build/charters.lifecycle.test.cjs"],
  ["src/routes/owners-api-proxy.test.ts", ".test-build/owners-api-proxy.test.cjs"],
]) {
  await build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile,
    sourcemap: "inline",
    external: ["*.node"],
  });
}