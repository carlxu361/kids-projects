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
```

## Project Notes

- Tech stack: HTML, CSS, JavaScript, static files
- Important folders: `/Users/xjc/Documents/kids-projects`, `/Users/xjc/Documents/kids-projects/scripts`
- Things to avoid: Do not delete published game folders. Do not expose admin-only/debug-only controls in the public portfolio.
