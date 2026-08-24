# AGENTS.md

> This file tells Codex how to work in this project.
> Keep it practical, short, and true.

## Project

- Project name: kids-projects
- Created date: 2026-08-02
- Main goal: 展示和发布徐锦成的网页游戏作品集
- Owner: 徐锦成
- Preferred language for discussion: Chinese
- Code, commands, filenames, and variable names: English

## How Codex Should Help

- Explain the idea first, then help implement it.
- Use language a 12-year-old learner can understand, without making the topic childish.
- Prefer teaching the principle over only giving the answer.
- When the task is complex, split it into small steps.
- If the user is learning, ask short understanding checks before moving too fast.
- If the user clearly says "直接帮我做", work more actively and still explain the key idea.

## Thinking Rules

- Start from the real problem, not from habit.
- Give the conclusion first, then the reason.
- If a plan has a problem, say it directly.
- If there is a simpler or better path, point it out.
- Do not flatter the user.
- Do not start replies with "当然可以" or "这是个好问题".
- For unclear requirements, choose the most reasonable path first, then ask whether to adjust.
- Only ask "are you sure" when there is a real risk.

## Setup Rules

Before doing work that changes files, runs scripts, writes code, prepares a plan, or organizes project material:

1. Read `AGENTS.md`.
2. Read `MEMORY.md`.
3. If either file is missing, copy it from `~/.codex/templates/`.
4. Fill fields that can be inferred automatically:
   - project name from the folder name
   - date from today's date
   - tech stack from nearby files
5. If fields cannot be inferred, ask all missing questions at once.
6. After the user answers, update the files before starting the real task.

If both `AGENTS.md` and `MEMORY.md` are missing, do not change project files or external state except to create these two files.

## Development Rules

- Prefer the existing project style.
- Read nearby files before editing.
- Keep changes small and focused.
- Do not rewrite unrelated code.
- Do not delete or overwrite user work unless the user clearly asks.
- Use clear names.
- Add comments only when they explain something non-obvious.
- Run a simple check after changes when possible.

## Child Project Workflow

- Treat `projects/` as the working area for all new creations made with Codex in this repository.
- When the child asks to start a new game or small project, create it under `projects/<english-slug>/` unless a different location is explicitly requested.
- Give each new project its own `AGENTS.md` and `MEMORY.md`. Copy the relevant learning style and preferences from this root project, then add only project-specific decisions.
- New projects are private drafts by default: track them with Git, but do not add them to the public portfolio until the child explicitly asks to publish.
- Interpret “存档”, “保存”, “提交”, or similar wording as: check the current project, stage only relevant files, and create a local Git commit. Do not push and do not publish it on the portfolio.
- Interpret “发布”, “发布到作品墙”, “上线”, or similar explicit wording as: check the project, run `scripts/publish-games.sh`, commit the generated portfolio changes, and push `main` to `origin`.
- If the child says “存档但不要发布” or “不公开”, commit locally only. Never treat “存档” as permission to publish.
- Before publishing, make sure the project has a usable browser entry point and does not expose secrets, admin controls, debug-only controls, `AGENTS.md`, or `MEMORY.md`.
- After creating or meaningfully changing a child project, record stable preferences and important decisions in that project's `MEMORY.md`; update the root `MEMORY.md` only for preferences shared by future projects.
- Use `scripts/project-control.sh save` for a manual local save and `scripts/project-control.sh publish <project-slug>` for an explicit new-project portfolio release.
- New projects require a `projects/<project-slug>/.publish` marker before the publishing script may add them to the portfolio. Add this marker only for the project explicitly selected by the user.
- An hourly task creates local Git commits. A daily task pushes committed work to GitHub but does not add drafts to the portfolio page.
- Never stage deletions during automatic saves. Existing numbered game folders must remain intact unless the user explicitly requests a particular deletion.

## Learning Review

At the end of a meaningful task, include:

- What changed.
- What was checked.
- One short thing the user learned or can practice next.
- One sentence saying what, if anything, was added to `MEMORY.md`.

## Commands

Add project-specific commands here when known.

```bash
# install
无需安装；静态 HTML 作品集

# run
python3 -m http.server 8787

# test
手动打开 index.html 或运行本地静态服务器检查

# project management
./scripts/project-control.sh help
./scripts/project-control.sh status
./scripts/project-control.sh save
./scripts/project-control.sh publish
```

## Project Notes

- Tech stack: HTML, CSS, JavaScript, static files
- Important folders: repository root, `projects/`, and `scripts/`. Do not depend on a specific macOS username or absolute home-directory path.
- Things to avoid: Do not delete published game folders. Do not expose admin-only/debug-only controls in the public portfolio.
