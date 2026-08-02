# MEMORY.md

> This file stores project memory.
> It should help future Codex sessions continue correctly without rereading everything.

## Project Summary

- Project name: space-hideout
- Created date: 2026-08-02
- Main goal: 重建原创桌面网页 Hide n Seek 多人游戏
- Current status: 彻底重建阶段 0 和阶段 1 已完成；随后按用户要求先做 AI，已新增 BOT 命名、船员/猎手有限状态机、效用评分和测试，但尚未接入房间、移动或地图
- Tech stack: pnpm workspace, TypeScript, Vite, Phaser 3, Socket.IO, Express, Vitest, Playwright, ESLint, Prettier

## User Preferences For This Project

- Default discussion language: Chinese
- Explain principles before implementation.
- Use simple, clear language suitable for a 12-year-old learner.
- Conclusion first, reason second.
- Do not flatter.
- Point out problems directly.
- Prefer small learning steps over doing everything silently.

## Decisions

- 2026-08-02: Decision: 第一轮只实现项目初始化、首页、基础公开房间、多窗口加入、空白测试地图、WASD 移动、服务器权威位置同步、简单墙壁碰撞、玩家姓名和 BOT 标志。
  Reason: 用户明确要求按阶段开发，不一次生成全部未经验证的功能。
- 2026-08-02: Decision: 代码、美术、地图和音频资源必须独立实现；缺少正式素材时用几何图形、程序动画和程序化占位音频。
  Reason: 用户要求保留熟悉玩法逻辑，但不能复制未授权资源。
- 2026-08-02: Decision: 彻底重建后每局固定一名猎手，任务只缩短普通 Hide 时间，完成所有任务不直接获胜。
  Reason: 用户要求以官方 Hide n Seek 模式信息逻辑为固定基线，删除旧版多人内鬼和任务胜利方向。
- 2026-08-02: Decision: 在房间、移动和地图尚未完成前，先实现纯函数式 AI 决策核心，不接入实时对局。
  Reason: 用户要求先做 AI，但真正可运行的 AI 依赖房间、移动、地图和任务数据；纯决策核心可以先测试，后续再接入。

## Architecture Notes

- 2026-08-02: Monorepo 计划使用 `apps/client`、`apps/server` 和 `packages/shared`，网络事件类型、游戏状态类型、配置常量和数学工具放在共享包中，避免客户端和服务器复制协议。
- 2026-08-02: 第一轮服务器使用单个公开房间 `public-alpha`；客户端只发送 WASD 输入意图，服务器按共享碰撞工具计算最终位置并广播房间快照。
- 2026-08-02: 重建阶段 1 改为 pnpm workspace；共享包只保留新协议、固定设置、阶段类型和危险值数学，客户端和服务器不再引用旧协议。
- 2026-08-02: AI 地基位于 `apps/server/src/ai`，共享 AI 类型位于 `packages/shared/src/types/ai.ts`；船员 AI 只看危险值、任务数、通风次数和阶段，猎手 AI 只看可见目标、Final Hide Ping/Seek 线索，不读取隐藏玩家精确坐标。

## Useful Commands

Record commands that are useful but not obvious.

```bash
# install
pnpm install

# run client and server
pnpm dev

# test
pnpm test
```

## Pitfalls And Fixes

- 2026-08-02: Problem: 当前 npm 对 `workspace:*` 依赖协议报 `EUNSUPPORTEDPROTOCOL`。
  Fix: 第一轮将前后端对共享包的依赖写成 `file:../../packages/shared`，仍保持共享协议包单一来源。
- 2026-08-02: Problem: 沙盒内直接启动本地 dev server 会因为端口监听和 `tsx watch` 管道权限报 `EPERM`。
  Fix: 启动本地前后端服务器时使用审批后的 `npm run dev`。
- 2026-08-02: Problem: `npx playwright install chromium` 下载的浏览器版本可能与项目本地 Playwright 不匹配。
  Fix: 使用 `npm exec -- playwright install chromium` 安装与项目依赖匹配的浏览器。
- 2026-08-02: Problem: pnpm 11 默认阻止 `esbuild` 构建脚本，导致安装以 `ERR_PNPM_IGNORED_BUILDS` 结束。
  Fix: 使用 `pnpm approve-builds esbuild` 批准 Vite 所需的 `esbuild` 构建脚本，然后重新运行 `pnpm install`。
- 2026-08-02: Problem: 共享包 `tsconfig` 把 `tests` 纳入发布构建时触发 `rootDir` 错误。
  Fix: 构建 `tsconfig` 只包含 `src`，测试由 Vitest 单独运行。

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

- 2026-08-02: 创建项目本地 `AGENTS.md` 和 `MEMORY.md`，记录第一轮开发边界和技术栈。
- 2026-08-02: 完成第一轮 MVP 地基：根目录脚本、共享包、服务器房间、客户端首页与 Phaser 测试地图、玩家渲染、WASD 输入、服务器权威位置同步、简单墙壁碰撞、单元测试和 Playwright 双窗口验收。
- 2026-08-02: 执行 Hide n Seek 彻底重建：旧实现已保存到 Git 备份提交、备份分支和标签；工作树中删除旧业务实现并创建新的 pnpm 阶段 1 骨架。
- 2026-08-02: 重建阶段 0/1 完成并验证：备份提交 `886357fd1765aa4ace2782500df84a4976ac5c4a`、分支 `backup/pre-hide-n-seek-rebuild`、标签 `pre-hide-n-seek-rebuild-v1`；`pnpm format:check`、`pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm test:e2e`、`pnpm build` 均通过。
- 2026-08-02: 按用户要求先做 AI：新增 `AiDecisionContext`、`AiDecision`、BOT 名称生成、船员/猎手 intent 决策和 AI 测试；`pnpm format:check`、`pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build`、`pnpm test:e2e` 均通过。

## Do Not Store

- Passwords
- API keys
- Tokens
- Private account details
- Large copies of code that already exist in the project
- Information that can be found easily in the code
