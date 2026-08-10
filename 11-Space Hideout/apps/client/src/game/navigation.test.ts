import { describe, expect, it } from "vitest";
import { findNavigationPath, nearestNavigationNode, type NavigationNode } from "./navigation";

const nodes: NavigationNode[] = [
  { id: "a", x: 0, y: 0, links: ["b"] },
  { id: "b", x: 10, y: 0, links: ["a", "c"] },
  { id: "c", x: 20, y: 0, links: ["b"] }
];

describe("navigation", () => {
  it("finds the shortest connected route", () => {
    expect(findNavigationPath(nodes, "a", "c")).toEqual(["a", "b", "c"]);
  });

  it("finds the closest navigation node", () => {
    expect(nearestNavigationNode(nodes, 16, 0).id).toBe("c");
  });
});
