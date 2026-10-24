# AGENTS.md

> This file tells Codex how to work in this project.
> Keep it practical, short, and true.

## Project

- Project name: Hogwarts Immersive Web Game
- Created date: 2026-10-24
- Main goal: 逐步建设徐锦成的高品质浏览器 3D 魔法冒险游戏，并保留可运行、可测试、可审阅的阶段成果
- Owner: 徐锦成
- Preferred language for discussion: Chinese
- Code, commands, filenames, and variable names: English

## How Codex Should Help

- Explain the idea first, then help implement it.
- Use language a 12-year-old learner can understand, without making the topic childish.
- Prefer teaching the principle over only giving the answer.
- Split complex work into small, reviewable stages.
- If the user clearly says “直接帮我做”, work actively and explain the key idea.

## Thinking Rules

- Start from the real problem, not from habit.
- Give the conclusion first, then the reason.
- If a plan has a problem, say it directly.
- If there is a simpler path, point it out.
- Do not claim code, assets, licenses, or tests that were not inspected or run.
- Unclear licensed assets stay out of the main project until verified.

## Setup Rules

Before changing files, running scripts, writing code, preparing a plan, or organizing project material:

1. Read `AGENTS.md`.
2. Read `MEMORY.md`.
3. Fill fields that can be inferred from the folder and nearby files.
4. Keep work inside this project unless the user explicitly requests a repository-wide change.
5. Keep unrelated parent-repository changes untouched.

## Development Rules

- Read nearby files before editing.
- Preserve useful existing work and prefer incremental changes.
- Keep rendering, physics, input, game rules, VFX, audio, UI, and data in separate modules.
- Keep placeholder assets clearly labeled `PLACEHOLDER` and record the asset gap.
- Do not copy code or assets from reference repositories until license and technical suitability are recorded.
- Use pnpm when the project has a package manager setup.
- Run type checking, linting, builds, tests, and browser checks that are available for the current stage.
- Record actual commands and results in the stage documents.

## Git and Publishing

- Work on a project branch using the `codex/` prefix.
- Commit only files belonging to this project and its required documentation.
- Do not publish this draft to the public portfolio unless the user explicitly asks to publish it.
- “存档/保存/提交” means create a local Git commit without publishing.
- “发布/上线/发布到作品墙” means run the repository publishing workflow, verify the browser entry point, then commit and push the requested release.
- Never expose `AGENTS.md`, `MEMORY.md`, secrets, debug-only controls, or admin controls in a public build.

## Learning Review

At the end of a meaningful task, include:

- What changed.
- What was checked.
- One short thing the user learned or can practice next.
- One sentence saying what, if anything, was added to `MEMORY.md`.

## Commands

```bash
# install (the verified command for this environment)
CI=true pnpm install --frozen-lockfile --ignore-scripts

# development
pnpm dev

# checks
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Project Notes

- Planned tech stack: React, TypeScript, Vite, React Three Fiber, Three.js, Rapier, Zustand, GLSL tooling, and pnpm.
- Important folders: `docs/`, `references/`, `src/`, `public/`, `tests/`, and `scripts/`.
- First priority: a high-quality Gothic magic courtyard and reliable shared first-person/third-person foundations.
- Do not depend on a specific macOS username or absolute home-directory path.
- Do not delete or overwrite unrelated projects or published game folders.
