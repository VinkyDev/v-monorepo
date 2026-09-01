import { access, cp, rm } from "node:fs/promises";
import path from "node:path";

const desktopRoot = path.join(import.meta.dirname, "..");
const webDist = path.join(desktopRoot, "../web/dist");
const dest = path.join(desktopRoot, "dist/renderer");

await access(webDist);
await rm(dest, { force: true, recursive: true });
await cp(webDist, dest, { recursive: true });
