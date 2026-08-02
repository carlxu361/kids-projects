import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  private grid?: Phaser.GameObjects.Graphics;

  constructor() {
    super("BootScene");
  }

  create(): void {
    this.grid = this.add.graphics();
    this.add
      .text(36, 34, "ORBITAL OUTPOST 01", {
        color: "#9fc6c1",
        fontFamily: "Courier New, monospace",
        fontSize: "20px"
      })
      .setAlpha(0.86);
  }

  update(time: number): void {
    if (!this.grid) {
      return;
    }

    this.grid.clear();
    this.grid.fillStyle(0x061318, 1);
    this.grid.fillRect(0, 0, 960, 540);
    this.grid.lineStyle(1, 0x31d8c8, 0.12);

    const offset = (time / 80) % 40;
    for (let x = -40 + offset; x < 960; x += 40) {
      this.grid.lineBetween(x, 0, x + 120, 540);
    }

    this.grid.lineStyle(2, 0xf4c05f, 0.38);
    this.grid.strokeRoundedRect(280, 145, 260, 170, 12);
    this.grid.lineStyle(2, 0xef5d75, 0.32);
    this.grid.strokeCircle(676, 276, 58);
    this.grid.fillStyle(0x31d8c8, 0.86);
    this.grid.fillCircle(194, 356, 9);
    this.grid.fillStyle(0xf4c05f, 0.86);
    this.grid.fillCircle(734, 172, 9);
  }
}
