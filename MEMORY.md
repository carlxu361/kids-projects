# MEMORY.md

> This file stores project memory.
> It should help future Codex sessions continue correctly without rereading everything.

## Project Summary

- Project name: kids-projects
- Created date: 2026-08-02
- Main goal: 展示和发布徐锦成的网页游戏作品集
- Current status: 已把 Space Hideout 加入发布脚本，并把作品集首页优化为按类型分组的展示面板
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

## Useful Commands

Record commands that are useful but not obvious.

```bash
python3 -m http.server 8787
PUBLISH_SKIP_GIT=1 /Users/xjc/Documents/kids-projects/scripts/publish-games.sh
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

## Do Not Store

- Passwords
- API keys
- Tokens
- Private account details
- Large copies of code that already exist in the project
- Information that can be found easily in the code
