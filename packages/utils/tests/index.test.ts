import { expect, test } from "vite-plus/test";
import { chunk, cn, sum } from "../src/index.ts";

test("re-exports es-toolkit", () => {
  expect(sum([1, 2, 3])).toBe(6);
  expect(chunk([1, 2, 3, 4], 2)).toEqual([
    [1, 2],
    [3, 4],
  ]);
});

test("cn merges tailwind classes", () => {
  expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
});
