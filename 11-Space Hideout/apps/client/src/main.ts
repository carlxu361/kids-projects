import Phaser from "phaser";
import "./styles.css";
import { CLIENT_CONFIG } from "./config/clientConfig";
import { BootScene } from "./scenes/BootScene";
import { ClientNetwork } from "./network/ClientNetwork";
import { bindHomeUi } from "./ui/homeUi";

const network = new ClientNetwork(CLIENT_CONFIG.serverUrl);

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "phaser-root",
  width: CLIENT_CONFIG.canvasWidth,
  height: CLIENT_CONFIG.canvasHeight,
  backgroundColor: "#061318",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene]
});

bindHomeUi(network);
