import { describe, expect, test } from "vite-plus/test";

import { cn } from "#/index.ts";

describe(cn, () => {
  test("cn merges tailwind classes and drops falsy inputs", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("text-sm", false, "font-bold")).toBe("text-sm font-bold");
  });
});
