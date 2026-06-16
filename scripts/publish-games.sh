#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="/Users/xjc/Developer/games/projects"
TARGET_REPO="/Users/xjc/Documents/kids-projects"
MAP_FILE="$TARGET_REPO/scripts/publish-map.tsv"

mkdir -p "$TARGET_REPO/scripts"

if [[ ! -f "$MAP_FILE" ]]; then
  cat > "$MAP_FILE" <<'EOF_MAP'
werewolf.html	01-月影村狼人杀	月影村狼人杀	多人狼人杀网页游戏，6到12人同屏轮流操作
chess.html	03-王冠棋桌	王冠棋桌	带谜题、棋谱和外观设置的国际象棋网页游戏
poker-games.html	04-王牌牌室	王牌牌室	扑克牌小游戏合集，包含记忆、配对、猜高低等玩法
EOF_MAP
fi

title_from_html() {
  perl -0777 -ne 'if (m#<title[^>]*>(.*?)</title>#is) { $t=$1; $t =~ s/\s+/ /g; $t =~ s/^\s+|\s+$//g; print $t; }' "$1"
}

next_number() {
  find "$TARGET_REPO" -maxdepth 1 -type d -name '[0-9][0-9]-*' -print \
    | sed -E 's#.*/([0-9][0-9])-.*#\1#' \
    | sort -n \
    | tail -1 \
    | awk '{ printf "%02d", $1 + 1 }'
}

append_new_projects_to_map() {
  find "$SOURCE_DIR" -maxdepth 1 -type f -name '*.html' -print | sort | while read -r source_path; do
    source_file="$(basename "$source_path")"

    if grep -Fq "$source_file	" "$MAP_FILE"; then
      continue
    fi

    title="$(title_from_html "$source_path")"
    if [[ -z "$title" ]]; then
      title="${source_file%.html}"
    fi

    number="$(next_number)"
    folder="$number-$title"
    description="孩子创作的网页游戏"
    printf "%s\t%s\t%s\t%s\n" "$source_file" "$folder" "$title" "$description" >> "$MAP_FILE"
    echo "发现新游戏：$source_file -> $folder"
  done
}

sync_projects() {
  while IFS=$'\t' read -r source_file folder title description; do
    [[ -z "${source_file:-}" ]] && continue

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
  done < "$MAP_FILE"
}

write_readme() {
  cat > "$TARGET_REPO/README.md" <<'EOF_README'
# 🧒 小小开发者的作品集

这里存放着我独立开发的小项目，每个项目一个文件夹。

## 📂 项目列表

| # | 项目 | 说明 |
|---|------|------|
| 01 | [月影村狼人杀](./01-月影村狼人杀/) | 多人狼人杀网页游戏，6～12 人同屏轮流操作 |
| 02 | [AI学习助手](./02-AI学习助手/) | AI驱动的学习助手，制定计划、跟踪进度、成就系统 |
EOF_README

  while IFS=$'\t' read -r _source_file folder title description; do
    number="${folder%%-*}"
    [[ "$number" == "01" ]] && continue
    printf '| %s | [%s](./%s/) | %s |\n' "$number" "$title" "$folder" "$description" >> "$TARGET_REPO/README.md"
  done < "$MAP_FILE"

  cat >> "$TARGET_REPO/README.md" <<'EOF_README'

## 🚀 怎么运行

每个项目都是纯前端项目，直接用浏览器打开 `index.html` 就能玩。

如果部署到 Vercel，打开仓库根目录就是作品集首页。
EOF_README
}

write_index() {
  cat > "$TARGET_REPO/index.html" <<'EOF_INDEX'
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>小小开发者作品集</title>
  <style>
    :root {
      color-scheme: light;
      --paper: #f8f4ea;
      --ink: #22201c;
      --muted: #70695f;
      --line: #d8cdbc;
      --sky: #2d8cff;
      --leaf: #43a56d;
      --sun: #f1a93b;
      --berry: #d94f70;
      --card: #fffdf7;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      background:
        linear-gradient(90deg, rgba(45, 140, 255, .08) 1px, transparent 1px),
        linear-gradient(rgba(45, 140, 255, .08) 1px, transparent 1px),
        var(--paper);
      background-size: 28px 28px;
      font-family: ui-rounded, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
    }
    header, main, footer { width: min(1100px, calc(100% - 32px)); margin: 0 auto; }
    header { padding: 48px 0 26px; }
    .label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
      color: var(--muted);
      font-size: 14px;
      font-weight: 700;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: var(--leaf);
      box-shadow: 18px 0 0 var(--sun), 36px 0 0 var(--berry);
    }
    h1 {
      max-width: 720px;
      margin: 0;
      font-size: clamp(38px, 8vw, 82px);
      line-height: .95;
      letter-spacing: 0;
    }
    .intro {
      max-width: 620px;
      margin: 18px 0 0;
      color: var(--muted);
      font-size: clamp(16px, 2vw, 20px);
      line-height: 1.75;
    }
    main { padding: 10px 0 52px; }
    .shelf {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 16px;
    }
    .project {
      min-height: 210px;
      padding: 18px;
      border: 2px solid var(--ink);
      border-radius: 8px;
      color: inherit;
      background: var(--card);
      box-shadow: 6px 6px 0 rgba(34, 32, 28, .18);
      text-decoration: none;
      transition: transform .16s ease, box-shadow .16s ease;
    }
    .project:hover,
    .project:focus-visible {
      transform: translate(-3px, -3px);
      box-shadow: 9px 9px 0 rgba(34, 32, 28, .18);
      outline: none;
    }
    .num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      margin-bottom: 18px;
      border-radius: 50%;
      color: white;
      background: var(--sky);
      font-weight: 900;
    }
    .project:nth-child(2n) .num { background: var(--leaf); }
    .project:nth-child(3n) .num { background: var(--sun); }
    .project:nth-child(4n) .num { background: var(--berry); }
    h2 {
      margin: 0;
      font-size: 24px;
      letter-spacing: 0;
    }
    .project p {
      margin: 10px 0 0;
      color: var(--muted);
      line-height: 1.65;
    }
    footer {
      padding: 0 0 38px;
      color: var(--muted);
      font-size: 14px;
    }
  </style>
</head>
<body>
  <header>
    <div class="label"><span class="dot"></span>作品集</div>
    <h1>小小开发者的游戏和学习工具</h1>
    <p class="intro">这里收藏孩子用 AI 和代码做出来的小项目。每个作品都可以直接打开体验，也可以继续修改、升级、发布。</p>
  </header>

  <main>
    <section class="shelf" aria-label="项目列表">
EOF_INDEX

  while IFS=$'\t' read -r _source_file folder title description; do
    number="${folder%%-*}"
    [[ "$number" == "01" ]] || continue
    cat >> "$TARGET_REPO/index.html" <<EOF_CARD
      <a class="project" href="./${folder}/">
        <span class="num">${number}</span>
        <h2>${title}</h2>
        <p>${description}。</p>
      </a>
EOF_CARD
  done < "$MAP_FILE"

  cat >> "$TARGET_REPO/index.html" <<'EOF_INDEX'
      <a class="project" href="./02-AI学习助手/">
        <span class="num">02</span>
        <h2>AI学习助手</h2>
        <p>制定学习计划、跟踪进度、收集徽章的学习工具。</p>
      </a>
EOF_INDEX

  while IFS=$'\t' read -r _source_file folder title description; do
    number="${folder%%-*}"
    [[ "$number" == "01" ]] && continue
    cat >> "$TARGET_REPO/index.html" <<EOF_CARD
      <a class="project" href="./${folder}/">
        <span class="num">${number}</span>
        <h2>${title}</h2>
        <p>${description}。</p>
      </a>
EOF_CARD
  done < "$MAP_FILE"

  cat >> "$TARGET_REPO/index.html" <<'EOF_INDEX'
    </section>
  </main>

  <footer>更新作品后运行发布脚本，GitHub 和 Vercel 会跟着更新。</footer>
</body>
</html>
EOF_INDEX
}

append_new_projects_to_map
sync_projects
write_readme
write_index

cd "$TARGET_REPO"
git add .gitignore README.md index.html scripts/publish-games.sh scripts/publish-map.tsv [0-9][0-9]-*

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
