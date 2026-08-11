import { expect, test } from "@playwright/test";

test("playtest map moves the player and updates appearance", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Space Hideout" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "角色装扮" })).toBeVisible();
  await expect(page.getByText("可用区域")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("#round-phase")).toHaveText("普通躲藏");
  await expect(page.locator("#round-clock")).toHaveText(/\d{2}:\d{2}/);
  await expect(page.locator("#task-status")).toHaveText("0 / 12");
  await expect(page.locator("#vent-status")).toHaveText("3 次");
  await expect(page.locator("#danger-console")).toHaveAttribute("aria-valuenow", "0");
  await expect(page.locator(".danger-crystal")).toHaveCount(6);
  await expect(page.locator("#http-status")).toHaveText("正常");
  await expect(page.getByRole("heading", { name: "猎手信号已锁定" })).toBeVisible();
  await expect(page.locator("#game-status")).toContainText("准备舱待命");

  const positionBefore = await page.locator("#position-readout").innerText();
  await page.getByRole("button", { name: "开始躲藏" }).click();
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

test("source entry routes players to the built game", async ({ page }) => {
  await page.goto("/apps/client/index.html");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("canvas")).toHaveCount(1);
});

test("two-way zipline and vent exit choice move the player between routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#game-status")).toContainText("准备舱待命");
  await page.getByRole("button", { name: "开始躲藏" }).click();
  await page.locator("canvas").click({ position: { x: 600, y: 380 } });

  await page.keyboard.down("e");
  await page.waitForTimeout(120);
  await page.keyboard.up("e");
  await page.waitForTimeout(950);
  await expect(page.locator("#position-readout")).toHaveText(/坐标 65\d · 136\d/);

  await page.keyboard.down("e");
  await page.waitForTimeout(120);
  await page.keyboard.up("e");
  await expect(page.locator("#vent-selector")).toBeVisible();
  await expect(page.getByRole("button", { name: "藏入管道（10秒）" })).toBeVisible();
  await page.getByRole("button", { name: "观察出口" }).click();
  await expect(page.locator("#vent-selector")).toBeHidden();
  await expect(page.locator("#position-readout")).toHaveText(/坐标 42\d · 70\d/);
});
