import { describe, expect, it } from "vitest";
import { readableHealth } from "./statusText";

describe("readableHealth", () => {
  it("turns health booleans into UI text", () => {
    expect(readableHealth(true)).toBe("正常");
    expect(readableHealth(false)).toBe("失败");
  });
});
