import { expect, test } from "@playwright/test";

test("home page connects to the rebuilt server", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Space Hideout" })).toBeVisible();
  await expect(page.locator("#http-status")).toHaveText("正常");
  await expect(page.locator("#phase-status")).toHaveText("lobby");
  await expect(page.locator("#protocol-status")).toContainText("hns-rebuild");

  await page.getByRole("button", { name: "连接服务器" }).click();
  await expect(page.locator("#socket-status")).toContainText("Client handshake accepted");
  await expect(page.locator("canvas")).toHaveCount(1);
});
