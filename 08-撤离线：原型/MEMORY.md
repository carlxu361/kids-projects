# MEMORY.md

> This file stores project memory.
> It should help future Codex sessions continue correctly without rereading everything.

## Project Summary

- Project name: extraction-raid-prototype
- Created date: 2026-07-10
- Main goal: 制作一个原创第一人称搜打撤网页游戏原型
- Current status: 第一版最小可玩原型已完成，等待用户试玩反馈
- Tech stack: HTML, CSS, JavaScript, Canvas raycasting, Web Audio

## User Preferences For This Project

- Default discussion language: Chinese
- Conclusion first, reason second.
- Explain the core design principle before implementation.
- The game should be first-person if possible.
- Gameplay matters more than graphics in the first version.
- The player wants to test-play the result.

## Decisions

- 2026-07-10: Decision: 第一版使用原创名字、原创地图结构和程序化视觉，不复制《三角洲行动》的地图、角色、美术或数值。
  Reason: 可以学习搜打撤玩法结构，但不能直接复刻受版权保护的具体内容。
- 2026-07-10: Decision: 使用浏览器 Canvas raycasting 做第一人称 3D-like 原型，而不是依赖大型 3D 引擎。
  Reason: 单文件附近的网页项目更容易本地运行、学习和继续迭代。
- 2026-07-10: Decision: 第一版先做进图、搜物资、AI、射击、背包格子、负重减速、安全箱、死亡掉落、撤离和仓库。
  Reason: 这些系统组成搜打撤游戏的最小闭环。

## Architecture Notes

- 2026-07-10: Project lives at `/Users/xjc/Developer/games/projects/extraction-raid-prototype`.
- 2026-07-10: `game.js` owns game state, raycasting render, AI, inventory, loot, extraction, persistence, and sound.
- 2026-07-10: `localStorage` stores stash, money, and last selected map.
- 2026-07-10: First playable loop includes movement, raycast first-person rendering, shooting, basic AI, loot containers, grid inventory, secure box, weight slowdown, fixed/random/switch extraction, death loss, extraction rewards, stash, and generated sound effects.

## Useful Commands

```bash
cd /Users/xjc/Developer/games/projects/extraction-raid-prototype
python3 -m http.server 8777
node --check game.js
```

## Pitfalls And Fixes

- 2026-07-10: Problem: “尽可能复刻”容易越过版权边界。
  Fix: 保留通用玩法机制，所有名称、地图和视觉表达保持原创。

## External Resources

- None.

## Session Log

- 2026-07-10: 根据 20 个问题的答案开始制作原创第一人称搜打撤最小可玩原型。
- 2026-07-10: 完成第一版原型，并通过 `node --check game.js`、本地 HTTP 200 返回检查和核心函数静态检查。

## Do Not Store

- Passwords
- API keys
- Tokens
- Private account details
- Large copies of code that already exist in the project
- Information that can be found easily in the code
