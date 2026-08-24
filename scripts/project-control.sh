#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCK_DIR="/tmp/kids-projects-git-$(id -u).lock"

usage() {
  cat <<'EOF'
孩子作品项目管理

用法：
  ./scripts/project-control.sh status
  ./scripts/project-control.sh save [说明]
  ./scripts/project-control.sh push
  ./scripts/project-control.sh publish [项目英文目录名]
  ./scripts/project-control.sh hourly
  ./scripts/project-control.sh daily
  ./scripts/project-control.sh help

命令：
  status   查看本地修改、分支和远端同步状态
  save     保存当前修改为本地 Git 版本，不推送、不发布
  push     先存档，再把已有版本推送到 GitHub，不更新作品墙
  publish  发布指定新项目，或刷新已经发布的项目，然后推送
  hourly   定时任务专用：有变化时创建本地自动存档
  daily    定时任务专用：先存档，再推送到 GitHub
  help     显示本帮助
EOF
}

ensure_repository() {
  if ! git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "错误：$REPO_ROOT 不是 Git 仓库。" >&2
    exit 1
  fi
}

acquire_lock() {
  if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    echo "已有另一个存档或发布任务正在运行，本次跳过。"
    exit 0
  fi
  trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT INT TERM
}

current_branch() {
  git -C "$REPO_ROOT" branch --show-current
}

save_changes() {
  local message="${1:-save: 手工存档 $(date '+%Y-%m-%d %H:%M')}"

  # Stage additions and modifications, but never turn accidental file removals
  # into a commit. This protects all existing published game folders.
  git -C "$REPO_ROOT" add --ignore-removal .

  if git -C "$REPO_ROOT" diff --cached --quiet; then
    echo "没有新的修改需要存档。"
    return 0
  fi

  git -C "$REPO_ROOT" commit -m "$message"
  echo "本地存档完成，尚未推送或发布。"
}

push_changes() {
  local branch
  branch="$(current_branch)"
  if [[ "$branch" != "main" ]]; then
    echo "错误：自动推送只允许 main 分支，当前分支是 ${branch:-分离状态}。" >&2
    exit 1
  fi
  git -C "$REPO_ROOT" push origin main
  echo "已把 main 推送到 GitHub；这不会重新生成作品墙。"
}

mark_project_for_publish() {
  local project_name="${1:-}"
  local project_dir

  if [[ -z "$project_name" ]]; then
    echo "未指定新项目：只刷新已经登记或标记发布的作品。"
    return 0
  fi
  if [[ "$project_name" == */* || "$project_name" == "." || "$project_name" == ".." ]]; then
    echo "错误：项目名只能是 projects/ 下的一层英文目录名。" >&2
    exit 1
  fi

  project_dir="$REPO_ROOT/projects/$project_name"
  if [[ ! -d "$project_dir" ]]; then
    echo "错误：找不到项目 projects/$project_name。" >&2
    exit 1
  fi
  if [[ ! -f "$project_dir/index.html" && ! -f "$project_dir/package.json" ]]; then
    echo "错误：项目需要 index.html 或 package.json 才能发布。" >&2
    exit 1
  fi

  touch "$project_dir/.publish"
  echo "已选择发布：projects/$project_name"
}

show_status() {
  git -C "$REPO_ROOT" status --short --branch
  echo
  git -C "$REPO_ROOT" remote -v
}

main() {
  local command="${1:-help}"
  shift || true

  ensure_repository

  case "$command" in
    status)
      show_status
      ;;
    save)
      acquire_lock
      save_changes "${*:-save: 手工存档 $(date '+%Y-%m-%d %H:%M')}"
      ;;
    push)
      acquire_lock
      save_changes "save: 推送前存档 $(date '+%Y-%m-%d %H:%M')"
      push_changes
      ;;
    publish)
      acquire_lock
      mark_project_for_publish "${1:-}"
      "$SCRIPT_DIR/publish-games.sh"
      ;;
    hourly)
      acquire_lock
      save_changes "autosave: 每小时存档 $(date '+%Y-%m-%d %H:%M')"
      ;;
    daily)
      acquire_lock
      save_changes "autosave: 每日推送前存档 $(date '+%Y-%m-%d %H:%M')"
      push_changes
      ;;
    help|-h|--help)
      usage
      ;;
    *)
      echo "未知命令：$command" >&2
      usage >&2
      exit 2
      ;;
  esac
}

main "$@"
