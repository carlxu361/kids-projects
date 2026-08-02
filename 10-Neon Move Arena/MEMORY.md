# MEMORY.md

> This file stores project memory.
> It should help future Codex sessions continue correctly without rereading everything.

## Project Summary

- Project name: neon-move-arena
- Created date: 2026-07-18
- Main goal: 制作一个快节奏本地多人横版网页生存游戏
- Current status: 第一版简易可玩原型已完成，正在按 Move or Die 风格做手感和地图迭代
- Tech stack: HTML, CSS, JavaScript, Canvas, Web Audio

## User Preferences For This Project

- Default discussion language: Chinese
- Explain principles before implementation.
- Use simple, clear language suitable for a 12-year-old learner.
- Conclusion first, reason second.
- Do not flatter.
- Point out problems directly.
- Prefer small learning steps over doing everything silently.

## Decisions

- 2026-07-18: Decision: 第一版做 4 人同屏积分生存赛，默认使用键盘本地多人。
  Reason: 用户明确要本地多人，并给出第 1 至第 4 名的回合得分规则。
- 2026-07-18: Decision: 比赛先到 100 分获胜，每回合 60 秒，倒计时结束后进入不能回血的骤死阶段。
  Reason: 用户明确要求加分到 100 分，并指定骤死不可以加血。
- 2026-07-18: Decision: 每 3 个回合更换一次突变器，正常阶段移动回血，不动掉血。
  Reason: 用户明确修正规则为“每3回合一次突变器（移动会回血）”。
- 2026-07-18: Decision: 场上始终保持 4 个参赛者，可设置真人玩家数，余下位置由 AI 补位。
  Reason: 用户要求“可设置人数（余下的用AI）”，同时原有 5/2/1/0 名次积分需要 4 个排名位。
- 2026-07-18: Decision: HUD 改为顶部横向赛况栏，舞台占主要空间，玩家卡不再显示侧栏/下方血条。
  Reason: 用户反馈窗口太小、血条在窗口下方，并希望更接近快节奏 party-platformer 的比赛可读性。
- 2026-07-19: Decision: 跌落/底边不再造成伤害，只由明确危险物、不移动、碰撞和骤死边界造成伤害。
  Reason: 用户明确要求“删除跌落伤害”，所以落到底部应被场地弹回或挡住，而不是直接扣血。
- 2026-07-19: Decision: 突变器改为“3选1，随机给 1 名玩家”，当前池子为二段跳、低重力、脉冲速度。
  Reason: 用户要求“突变器改成3选1（随机选择1人）”，所以突变效果从全员规则改成单人状态。
- 2026-07-19: Decision: 血条放在游戏画面底部 HUD，角色头顶只保留名字和 MOVE 提醒。
  Reason: 用户最新反馈要求血条放在屏幕下方。

## Architecture Notes

- 2026-07-18: 项目使用 `index.html`、`style.css`、`game.js` 三个核心文件；Canvas 负责主要游戏画面，DOM 负责分数和状态面板。

## Useful Commands

```bash
open /Users/xjc/Developer/games/projects/neon-move-arena/index.html
node --check /Users/xjc/Developer/games/projects/neon-move-arena/game.js
```

## Pitfalls And Fixes

- 2026-07-18: Problem: 100 分正式局可能较长，调试时不方便。
  Fix: 游戏保留 100 分正式目标，同时在界面提供 25 分和 50 分试玩目标，便于快速测试手感。

## External Resources

- 2026-07-18: Resource: 本地游戏入口
  Location: `/Users/xjc/Developer/games/projects/neon-move-arena/index.html`

## Session Log

- 2026-07-18: 根据 20 个问题和后续规则修正，开始制作简易版 Neon Move Arena。
- 2026-07-18: 完成第一版：4 人同屏、回合积分、100 分目标、每 3 回合换突变器、移动回血、不动掉血、60 秒后骤死禁回血、3 张地图和 6 个突变器。
- 2026-07-18: 验证通过：`node --check game.js`；假浏览器烟测确认开始后进入第 1 回合、4 个玩家面板出现、分数按 5/2/1/0 结算、突变器第 4 回合才切换、骤死阶段移动不会回血。
- 2026-07-18: 根据试玩反馈更新：新增玩家人数选择，未选真人的位置自动成为 AI；AI 会移动、跳跃和避边界；界面改为更大 Canvas 舞台和顶部赛况栏。验证通过：1 人模式下有 3 个 AI 补位，AI 会移动，旧玩家卡血条不再渲染。
- 2026-07-19: 根据试玩反馈更新：Canvas 改为 1280×720，角色改为 24×36；地图增加更多平台、闪烁危险板和横向/纵向激光；底边只弹回不扣血；突变器改为 3 选 1 并随机给 1 人；血条移到屏幕底部 HUD。验证通过：底边弹回不扣血、只有 1 名玩家获得突变器、AI 会移动且目标点不全重合。

## Do Not Store

- Passwords
- API keys
- Tokens
- Private account details
- Large copies of code that already exist in the project
- Information that can be found easily in the code
