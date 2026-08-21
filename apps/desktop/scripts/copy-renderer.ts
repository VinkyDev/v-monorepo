import { access, cp, rm } from "node:fs/promises";
import { join } from "node:path";

const desktopRoot = join(import.meta.dirname, "..");
const webDist = join(desktopRoot, "../web/dist");
const dest = join(desktopRoot, "dist/renderer");

await access(webDist);
await rm(dest, { recursive: true, force: true });
await cp(webDist, dest, { recursive: true });
