import { describe, expect, test } from "vite-plus/test";

import { assertNever } from "#/index.ts";

const label = (side: "left" | "right"): string => {
  switch (side) {
    case "left": {
      return "L";
    }
    case "right": {
      return "R";
    }
    default: {
      return assertNever(side);
    }
  }
};

describe(assertNever, () => {
  test("is valid in an exhaustive switch", () => {
    expect(label("left")).toBe("L");
    expect(label("right")).toBe("R");
  });
});
