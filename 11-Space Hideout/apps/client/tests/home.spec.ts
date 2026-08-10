import { expect, test } from "@playwright/test";

test("playtest map moves the player and updates appearance", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Space Hideout" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "角色装扮" })).toBeVisible();
  await expect(page.getByText("可用区域")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("#round-phase")).toHaveText("普通躲藏");
  await expect(page.locator("#round-clock")).toHaveText(/\d{2}:\d{2}/);
  await expect(page.locator("#danger-console")).toHaveAttribute("aria-valuenow", "0");
  await expect(page.locator(".danger-crystal")).toHaveCount(6);
  await expect(page.locator("#http-status")).toHaveText("正常");

  const positionBefore = await page.locator("#position-readout").innerText();
  await page.locator("canvas").click({ position: { x: 600, y: 380 } });
  await page.keyboard.down("d");
  await page.waitForTimeout(450);
  await page.keyboard.up("d");
  await expect(page.locator("#position-readout")).not.toHaveText(positionBefore);

  await page.getByRole("button", { name: "天线" }).click();
  await expect(page.locator("#avatar-preview")).toHaveAttribute("data-hat", "antenna");

  await page.getByRole("button", { name: "全图扫描" }).click();
  await page.getByRole("button", { name: "回到出生舱" }).click();
  await expect(page.locator("#game-status")).toContainText("出生舱");
});
