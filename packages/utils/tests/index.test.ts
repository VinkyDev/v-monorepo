import { expect, test } from "vite-plus/test";
import { cn } from "@/index.ts";

test("cn resolves conflicting tailwind classes", () => {
  expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
});

test("cn omits conditional classes", () => {
  expect(cn("text-sm", false, "font-bold")).toBe("text-sm font-bold");
});
