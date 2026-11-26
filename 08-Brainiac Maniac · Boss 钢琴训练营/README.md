# Brainiac Maniac · Boss 钢琴训练营

## 运行

在作品集根目录运行 `python3 -m http.server 8787`，浏览器打开 `http://localhost:8787/` 后进入钢琴训练营。访问线上版本时使用 HTTPS。浏览器通过 HTTP 或 HTTPS 读取随项目提供的钢琴采样。

## 用真实钢琴跟练

1. 选择曲目和声部，然后点击「用真实钢琴跟练」，允许浏览器使用麦克风。
2. 看琴台上点亮的目标键，在声学钢琴上弹一个音。弹对才会进入下一音。再次弹同一个音时，请先松键并让前一个音衰减一些。
3. 右手跟练提取旋律高音，左手跟练提取低音。双手选项默认跟练右手旋律。示范播放支持完整双手和弦、独奏声部及变速。

麦克风音频在浏览器内分析。跟练结束或手动暂停后释放麦克风。没有钢琴时可以选择「用网页琴键跟练」，使用鼠标、触屏或琴键上标出的电脑按键弹奏。电脑可用 `[` 和 `]` 换八度，空格切换延音。手机可用琴台箭头换音域。

## 琴声与曲目

- 采样为 Alexander Holm 的 **Salamander Grand Piano**（Yamaha C5），依据 [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) 使用。使用 [Tone.js 音频库](https://github.com/Tonejs/audio/tree/master/salamander) 发布的 MP3 子集，左右声道保留，相邻音通过变速移调。[上游署名及说明](samples/UPSTREAM.txt)。
- 三首完整示范为原创八小节短曲。《Brainiac Maniac》原曲的完整谱请另用合法取得的曲谱。
