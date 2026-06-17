import { mkdir, rm } from "node:fs/promises";

async function buildEntrypoint(entrypoint: string, outdir: string): Promise<void> {
  const result = await Bun.build({
    entrypoints: [entrypoint],
    outdir,
    target: "browser",
    format: "esm",
    sourcemap: "external",
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error(`Build failed for ${entrypoint}`);
  }
}

await rm("extension/dist", { recursive: true, force: true });
await mkdir("extension/dist", { recursive: true });
await buildEntrypoint("extension/src/background/service-worker.ts", "extension/dist/background");
await buildEntrypoint("extension/src/popup/app.ts", "extension/dist/popup");
console.log("built extension/dist");
