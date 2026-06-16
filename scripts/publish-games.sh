#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="/Users/xjc/Developer/games/projects"
TARGET_REPO="/Users/xjc/Documents/kids-projects"

PROJECTS=(
  "werewolf.html|01-月影村狼人杀|月影村狼人杀|多人狼人杀网页游戏，6到12人同屏轮流操作"
  "chess.html|03-王冠棋桌|王冠棋桌|带谜题、棋谱和外观设置的国际象棋网页游戏"
  "poker-games.html|04-王牌牌室|王牌牌室|扑克牌小游戏合集，包含记忆、配对、猜高低等玩法"
)

mkdir -p "$TARGET_REPO/scripts"

for entry in "${PROJECTS[@]}"; do
  IFS="|" read -r source_file folder title description <<< "$entry"
  source_path="$SOURCE_DIR/$source_file"
  target_dir="$TARGET_REPO/$folder"

  if [[ ! -f "$source_path" ]]; then
    echo "跳过：找不到 $source_path"
    continue
  fi

  mkdir -p "$target_dir"
  cp "$source_path" "$target_dir/index.html"
  cat > "$target_dir/README.md" <<EOF_INNER
# ${title}

${description}。

## 怎么运行

直接用浏览器打开 \`index.html\`。
EOF_INNER
  echo "已同步：$source_file -> $folder"
done

cat > "$TARGET_REPO/README.md" <<'EOF_README'
# 🧒 小小开发者的作品集

这里存放着我独立开发的小项目，每个项目一个文件夹。

## 📂 项目列表

| # | 项目 | 说明 |
|---|------|------|
| 01 | [月影村狼人杀](./01-月影村狼人杀/) | 多人狼人杀网页游戏，6～12 人同屏轮流操作 |
| 02 | [AI学习助手](./02-AI学习助手/) | AI驱动的学习助手，制定计划、跟踪进度、成就系统 |
| 03 | [王冠棋桌](./03-王冠棋桌/) | 带谜题、棋谱和外观设置的国际象棋网页游戏 |
| 04 | [王牌牌室](./04-王牌牌室/) | 扑克牌小游戏合集，包含记忆、配对、猜高低等玩法 |

## 🚀 怎么运行

每个项目都是纯前端项目，直接用浏览器打开 `index.html` 就能玩。

如果部署到 Vercel，打开仓库根目录就是作品集首页。
EOF_README

cd "$TARGET_REPO"
git add .gitignore README.md index.html scripts/publish-games.sh \
  "01-月影村狼人杀" "03-王冠棋桌" "04-王牌牌室"

if git diff --cached --quiet; then
  echo "没有新的变化需要提交，继续检查是否有未推送内容。"
else
  commit_message="publish: 同步孩子的游戏作品 $(date '+%Y-%m-%d %H:%M')"
  git commit -m "$commit_message"
fi

if git push origin main; then
  echo "已推送到 GitHub。Vercel 如果已连接这个仓库，会自动开始部署。"
else
  echo "GitHub 现在连接不上。本地提交已保留，网络恢复后再运行本脚本即可继续推送。"
  exit 1
fi
