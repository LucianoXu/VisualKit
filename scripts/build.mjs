// The demo, built: the kit's stylesheet bundled into one file, the demo's TypeScript into one
// module, beside its HTML. The output goes to stignore-build/ — derived, rebuilt in full each time,
// and kept off the other replicas (the Vault's .stignore).
//
//   node scripts/build.mjs            build into stignore-build/demo/
//   node scripts/build.mjs --serve    build, then serve it at http://localhost:5178, rebuilding on change
import * as esbuild from "esbuild";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "stignore-build", "demo");
const serve = process.argv.includes("--serve");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const f of ["index.html", "tokens.html", "demo.css"]) cpSync(join(ROOT, "demo", f), join(OUT, f));

const builds = [
  { entryPoints: [join(ROOT, "src/css/visualkit.css")], outfile: join(OUT, "visualkit.css"), bundle: true },
  { entryPoints: [join(ROOT, "demo/src/main.ts")], outfile: join(OUT, "demo.js"), bundle: true, format: "esm", target: "es2022", sourcemap: true },
];

if (!serve) {
  for (const b of builds) await esbuild.build({ ...b, logLevel: "warning" });
  console.log(`built ${OUT}`);
} else {
  const ctxs = await Promise.all(builds.map((b) => esbuild.context({ ...b, logLevel: "info" })));
  await Promise.all(ctxs.map((c) => c.watch()));
  const { port } = await ctxs[1].serve({ servedir: OUT, port: 5178 });
  console.log(`VisualKit demo: http://localhost:${port}`);
}
