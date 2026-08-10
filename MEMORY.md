# MEMORY.md

> This file stores project memory.
> It should help future Codex sessions continue correctly without rereading everything.

## Project Summary

- Project name: kids-projects
- Created date: 2026-08-02
- Main goal: 展示和发布徐锦成的网页游戏作品集
- Current status: 已把 Space Hideout 加入发布脚本、优化为按类型分组的展示面板，并支持在作品集中直接运行其可操作的大地图静态试玩版
- Tech stack: HTML, CSS, JavaScript, static files

## User Preferences For This Project

- Default discussion language: Chinese
- Explain principles before implementation.
- Use simple, clear language suitable for a 12-year-old learner.
- Conclusion first, reason second.
- Do not flatter.
- Point out problems directly.
- Prefer small learning steps over doing everything silently.

## Decisions

- 2026-08-02: Decision: 作品集首页按游戏类型合并展示，并为每个游戏提供图标和简介。
  Reason: 用户要求优化展示面板、增加图标和简介、把同类游戏合并。

## Architecture Notes

- 2026-08-02: 发布脚本位于 `/Users/xjc/Documents/kids-projects/scripts/publish-games.sh`，项目映射表位于 `/Users/xjc/Documents/kids-projects/scripts/publish-map.tsv`。
- 2026-08-02: `publish-map.tsv` 采用 6 列：源文件/目录、作品集目录、标题、简介、类型、图标；首页按类型分组生成。
- 2026-08-02: 发布脚本支持根目录 `index.html` 的静态游戏，也支持根目录 `package.json` 的工程项目；工程项目会排除 `node_modules`、`dist`、测试报告等目录，并生成作品集入口页。
- 2026-08-02: `Space Hideout` 作品集入口页是启动台：默认填写 `http://127.0.0.1:5173`，可以检测/打开本地游戏，并提示双击 `/Users/xjc/Developer/games/启动 Space Hideout.command`。
- 2026-08-02: `space-hideout` 是特殊发布项目：脚本会用 `VITE_STATIC_DEMO=1` 构建 Phaser 客户端，并把构建产物直接发布到 `11-Space Hideout/`，因此 Vercel 静态站点可以直接打开试玩版。
- 2026-08-10: `11-Space Hideout/` 的根入口直接使用 Vite 构建产物，不再嵌套在线试玩 iframe；发布脚本会将构建后的 `index.html` 和 `assets/` 放到该目录根部。

## Useful Commands

Record commands that are useful but not obvious.

```bash
python3 -m http.server 8787
PUBLISH_SKIP_GIT=1 /Users/xjc/Documents/kids-projects/scripts/publish-games.sh
/Users/xjc/Developer/games/启动\ Space\ Hideout.command
```

## Pitfalls And Fixes

Record problems we hit and how we solved them.

Format:

```markdown
- YYYY-MM-DD: Problem: TODO
  Fix: TODO
```

- 2026-08-02: Problem: `space-hideout` 没有被 `/Users/xjc/Developer/games/发布到作品集.command` 发布。
  Fix: 原因是它没有登记在 `publish-map.tsv`，并且根目录没有 `index.html`；已补充映射，并让脚本识别 `package.json` 工程项目。
- 2026-08-02: Problem: 自动发布脚本会提交并推送远程仓库，工具安全审查不允许本次直接代推。
  Fix: 增加 `PUBLISH_SKIP_GIT=1` 本地验证模式；用户双击原 command 时仍会走正常提交和推送流程。

## External Resources

Record links or file locations.

Important rule: record where credentials are stored, never record credential values.

```markdown
- YYYY-MM-DD: Resource: TODO
  Location: TODO
```

## Session Log

Add short notes after meaningful work.

Format:

- 2026-08-02: 从模板创建作品集本地 `AGENTS.md` 和 `MEMORY.md`，准备加入 Space Hideout 并优化首页。
- 2026-08-02: 将 `space-hideout` 加入作品集为 `11-Space Hideout`；优化首页为按类型分组的展示面板，为每个作品显示图标、类型、编号和简介；本地预览与桌面/窄屏截图检查通过。
- 2026-08-02: 将 `11-Space Hideout` 入口页升级为本地游戏启动台，加入网址输入、检测按钮、双击启动器路径、外观/AI/动画预览。
- 2026-08-02: 改为在作品集内直接载入 Space Hideout 静态试玩版；页面展示外观切换、AI 状态和飞船动画，完整多人服务器仍在后续阶段部署。
- 2026-08-02: Space Hideout 静态试玩升级为可操作大地图：作品集会嵌入 WASD/Shift/E 移动、终端修复、AI 巡逻、危险表和完整装扮面板；多人服务器仍需后续部署。
- 2026-08-10: Space Hideout 线上入口改为直接进入可完成的原创躲藏试玩回合，不再显示本机启动说明或 iframe 包装页。
- 2026-08-10: 作品集内误开 `11-Space Hideout/apps/client/index.html` 时会自动回到根游戏页，避免显示无样式开发源码。
- 2026-08-10: Space Hideout 线上试玩同步了准备舱猎手信号播报、原创能量失效标记、导航驱动 AI、跃迁管、梯子和单向滑索；仍不包含任何现有游戏的地图或素材。

## Do Not Store

- Passwords
- API keys
- Tokens
- Private account details
- Large copies of code that already exist in the project
- Information that can be found easily in the code
