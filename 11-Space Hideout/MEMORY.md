# MEMORY.md

- 2026-08-11: Space Hideout 线上试玩扩大到 3500 x 2200、12 个任务，使用分段防穿墙碰撞；删除梯子，滑索改为双向，跃迁管支持多出口选择或躲藏 10 秒。

> This file stores project memory.
> It should help future Codex sessions continue correctly without rereading everything.

## Project Summary

- Project name: space-hideout
- Created date: 2026-08-02
- Main goal: 重建原创桌面网页 Hide n Seek 多人游戏
- Current status: 彻底重建阶段 0 和阶段 1 已完成；随后按用户要求先做 AI，并新增启动大厅、2600 × 1600 可操作地图试玩、外观预览、AI 状态面板、Phaser 动画、macOS 双击启动器和可嵌入作品集的静态试玩版；多人服务器尚未接入完整房间和权威移动
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
- 2026-08-02: Decision: 先为静态作品集实现客户端可玩纵切，再接服务器权威对局。
  Reason: 用户指出页面地图小且无法游玩；先验证大地图、移动、碰撞、终端互动和外观手感，后续再把同一输入与任务请求交给服务器验证。
- 2026-08-10: Decision: 危险仪表和音乐使用原创 HUD 与 Web Audio 程序化节拍，不加入标明为官方的图片或音乐文件。
  Reason: 保留危险程度的信息逻辑，同时避免未授权素材进入项目或作品集。
- 2026-08-10: Decision: 静态试玩使用 90 秒普通躲藏与 25 秒 Final Hide，终端每次最多缩短 8 秒普通躲藏时间；被猎手贴近则失败，存活到零则胜利。
  Reason: 让线上试玩拥有接近 Hide n Seek 的可完成回合，而不假装已经是完整多人对局。
- 2026-08-10: Decision: 静态试玩 AI 使用原创导航节点图：猎手巡逻、视线追击和最后目击搜索；船员分工修终端、遇险撤离，并可有限次使用跃迁管。
  Reason: 修复原先按固定圈移动导致的低质量 AI，同时不复刻任何既有游戏地图或路线。

## Architecture Notes

- 2026-08-02: Monorepo 计划使用 `apps/client`、`apps/server` 和 `packages/shared`，网络事件类型、游戏状态类型、配置常量和数学工具放在共享包中，避免客户端和服务器复制协议。
- 2026-08-02: 第一轮服务器使用单个公开房间 `public-alpha`；客户端只发送 WASD 输入意图，服务器按共享碰撞工具计算最终位置并广播房间快照。
- 2026-08-02: 重建阶段 1 改为 pnpm workspace；共享包只保留新协议、固定设置、阶段类型和危险值数学，客户端和服务器不再引用旧协议。
- 2026-08-02: AI 地基位于 `apps/server/src/ai`，共享 AI 类型位于 `packages/shared/src/types/ai.ts`；船员 AI 只看危险值、任务数、通风次数和阶段，猎手 AI 只看可见目标、Final Hide Ping/Seek 线索，不读取隐藏玩家精确坐标。
- 2026-08-02: 本机双击启动器位于 `/Users/xjc/Developer/games/启动 Space Hideout.command`；它会进入 `space-hideout`、必要时安装依赖、运行 `pnpm dev` 并打开 `http://127.0.0.1:5173`。
- 2026-08-02: 作品集发布脚本会以 `VITE_STATIC_DEMO=1` 构建客户端，并把构建结果放到 `https://xxby.carlxu.cn/11-Space%20Hideout/`；静态试玩版不请求 Socket.IO 服务器，只展示可交互外观、AI 状态与 Phaser 动画。
- 2026-08-02: 静态试玩地图位于 `apps/client/src/scenes/BootScene.ts`：世界尺寸 2600 × 1600，WASD/Shift/E、客户端碰撞、3 个终端、两名船员 BOT 与一名猎手 BOT；外观通过 `space-hideout:appearance` 浏览器事件同步到 Phaser 角色。

## Useful Commands

Record commands that are useful but not obvious.

```bash
# install
pnpm install

# run client and server
pnpm dev

# macOS double-click launcher
/Users/xjc/Developer/games/启动\ Space\ Hideout.command

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
- 2026-08-02: Problem: 在作品集里直接打开 `11-Space Hideout/apps/client/` 会只显示未带样式的 HTML。
  Fix: 该文件是 Vite 开发源入口，浏览器无法直接运行其 TypeScript；当它被 HTTP 静态站点直接访问时，自动跳回 `11-Space Hideout/` 的打包试玩入口。
- 2026-08-10: Problem: 当前源码被误放到 `_archive/legacy-pre-rebuild`，项目根目录缺少 `apps/client/index.html`，启动时出现 `ERR_FILE_NOT_FOUND`。
  Fix: 保留归档并将源码复制回根目录；归档已从 Git、Lint 和构建扫描中排除，启动器会先检查前端入口。
- 2026-08-10: Problem: 直接双击 `apps/client/index.html` 会绕过 Vite，显示无样式的源码 HTML。
  Fix: 开发入口在本机文件路径下跳转到线上试玩页，在 HTTP 源码路径下跳转到对应根入口。

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
- 2026-08-02: 按用户要求让网站更像可启动程序：客户端首页改为启动大厅，加入本地网址输入、外观颜色预览、AI 船员/猎手状态、Phaser 巡逻/扫描动画；新增 macOS 双击启动器。
- 2026-08-02: 按用户要求改为在作品集直接载入：发布流程会自动构建静态试玩版，线上入口直接显示 Space Hideout 的外观、AI 状态和飞船动画，不再显示本机启动命令。
- 2026-08-02: 根据“地图太小、玩不了、个性化和动画不够”的反馈，将静态试玩升级为大地图可玩纵切，并把外观扩展为颜色、帽子、面罩、背包和表情组合；类型、Lint、单元测试、移动/外观 Playwright 测试、构建和静态截图检查通过。
- 2026-08-02: 修复作品集误开开发源入口导致的白页式 HTML：`apps/client/index.html` 在静态 HTTP 路径下会自动跳转到正确的 `11-Space Hideout/` 试玩入口。
- 2026-08-10: 恢复被误归档的 Space Hideout 源码到项目根目录，保留 `_archive/legacy-pre-rebuild` 作为可恢复副本，并修正启动器的入口检查。
- 2026-08-10: 将试玩 HUD 的普通进度条升级为原创六晶体威胁波形仪，并在第一次玩家点击后用 Web Audio 合成随危险值加快的警报节拍。
- 2026-08-10: 将静态试玩升级为可胜负的躲藏回合：任务只缩短普通躲藏时间，Final Hide 关闭任务并加速猎手；程序化音乐叠加低沉底噪、节拍与高频扫描层。
- 2026-08-10: 修复误开开发源入口导致的裸页面：`apps/client/index.html` 会自动导向可运行的构建版本。
- 2026-08-10: 静态试玩 AI 改为导航驱动，加入三组原创跃迁管网络；玩家与船员可用，猎手不能用。
- 2026-08-10: 静态试玩加入准备舱猎手信号播报，点击“开始躲藏”后才启动倒计时和 AI；新增三组梯子、两条单向滑索、原创能量失效标记，以及梯子/滑索 Playwright 回归测试。
- 2026-08-11: 静态试玩地图扩大为 3500 × 2200，终端增加到 12 个；玩家移动使用分段圆形碰撞，移除梯子，滑索改为双向，跃迁管改为可选出口或最多躲藏 10 秒。

## Do Not Store

- Passwords
- API keys
- Tokens
- Private account details
- Large copies of code that already exist in the project
- Information that can be found easily in the code
