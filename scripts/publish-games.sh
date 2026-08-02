#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="/Users/xjc/Developer/games/projects"
TARGET_REPO="/Users/xjc/Documents/kids-projects"
MAP_FILE="$TARGET_REPO/scripts/publish-map.tsv"
PUBLISH_SKIP_GIT="${PUBLISH_SKIP_GIT:-0}"

mkdir -p "$TARGET_REPO/scripts"

if [[ ! -f "$MAP_FILE" ]]; then
  cat > "$MAP_FILE" <<'EOF_MAP'
werewolf.html	01-月影村狼人杀	月影村狼人杀	6 到 12 人同屏轮流操作的社交推理网页游戏	社交推理	🐺
chess.html	03-王冠棋桌	王冠棋桌	带谜题、棋谱和外观设置的国际象棋练习桌	棋类策略	♟️
poker-games.html	04-王牌牌室	王牌牌室	扑克牌小游戏合集，包含记忆、配对、猜高低等玩法	纸牌合集	🃏
EOF_MAP
fi

title_from_html() {
  perl -0777 -ne 'if (m#<title[^>]*>(.*?)</title>#is) { $t=$1; $t =~ s/\s+/ /g; $t =~ s/^\s+|\s+$//g; print $t; }' "$1"
}

title_from_package() {
  perl -0777 -ne 'if (m/"name"\s*:\s*"([^"]+)"/) { print $1; }' "$1"
}

html_escape() {
  perl -CS -pe 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g; s/"/\&quot;/g'
}

next_number() {
  find "$TARGET_REPO" -maxdepth 1 -type d -name '[0-9][0-9]-*' -print \
    | sed -E 's#.*/([0-9][0-9])-.*#\1#' \
    | sort -n \
    | tail -1 \
    | awk '{ printf "%02d", $1 + 1 }'
}

project_category() {
  case "$1" in
    *review*|*chinese*|*piano*|*camp*) printf "学习工具" ;;
    *2048*) printf "益智合成" ;;
    *poker*|*card*) printf "纸牌合集" ;;
    *chess*) printf "棋类策略" ;;
    *werewolf*) printf "社交推理" ;;
    *space*|*hideout*) printf "联机原型" ;;
    *raid*|*shooter*|zu) printf "动作原型" ;;
    *arena*|*roulette*) printf "派对竞技" ;;
    *) printf "其他作品" ;;
  esac
}

project_icon() {
  case "$1" in
    学习工具) printf "📚" ;;
    益智合成) printf "🔢" ;;
    纸牌合集) printf "🃏" ;;
    棋类策略) printf "♟️" ;;
    社交推理) printf "🐺" ;;
    联机原型) printf "🛰️" ;;
    动作原型) printf "🎯" ;;
    派对竞技) printf "⚡" ;;
    音乐训练) printf "🎹" ;;
    *) printf "🎮" ;;
  esac
}

project_description() {
  case "$1" in
    space-hideout) printf "Hide n Seek 多人联机重建原型，包含 pnpm 前后端骨架和 AI 决策地基" ;;
    extraction-raid-prototype) printf "第一人称搜打撤原型，包含搜索、战斗、背包和撤离循环" ;;
    final-review-camp) printf "语文、数学、英语复习闯关工具，包含错题、草稿和宠物奖励" ;;
    picture-chinese-quest) printf "看图理解中文句子的语文练习小游戏" ;;
    roof-piano-camp) printf "分阶段钢琴训练营，练习节奏、识谱、左右手配合和单音音准" ;;
    neon-move-arena) printf "本地多人霓虹竞技场，支持 AI 补位、回合计分和突变器" ;;
    zu) printf "原创 3D 战术射击原型，练习移动、瞄准、HUD 和 AI 队友" ;;
    *) printf "孩子创作的网页游戏" ;;
  esac
}

source_has_entry() {
  grep -Fq "$1	" "$MAP_FILE"
}

source_is_publishable() {
  local source_path="$1"

  if [[ -f "$source_path" && "$source_path" == *.html ]]; then
    return 0
  fi

  if [[ -d "$source_path" && -f "$source_path/index.html" ]]; then
    return 0
  fi

  if [[ -d "$source_path" && -f "$source_path/package.json" ]]; then
    return 0
  fi

  return 1
}

append_new_projects_to_map() {
  find "$SOURCE_DIR" -mindepth 1 -maxdepth 1 \( -type f -name '*.html' -o -type d \) -print | sort | while read -r source_path; do
    local source_file title number folder description category icon
    source_file="$(basename "$source_path")"

    if source_has_entry "$source_file"; then
      continue
    fi

    if ! source_is_publishable "$source_path"; then
      continue
    fi

    if [[ -d "$source_path" && -f "$source_path/index.html" ]]; then
      title="$(title_from_html "$source_path/index.html")"
    elif [[ -d "$source_path" && -f "$source_path/package.json" ]]; then
      title="$(title_from_package "$source_path/package.json")"
    else
      title="$(title_from_html "$source_path")"
    fi
    if [[ -z "$title" ]]; then
      title="${source_file%.html}"
    fi

    number="$(next_number)"
    folder="$number-$title"
    description="$(project_description "$source_file")"
    category="$(project_category "$source_file")"
    icon="$(project_icon "$category")"
    printf "%s\t%s\t%s\t%s\t%s\t%s\n" "$source_file" "$folder" "$title" "$description" "$category" "$icon" >> "$MAP_FILE"
    echo "发现新游戏：$source_file -> $folder"
  done
}

write_project_readme() {
  local target_dir="$1"
  local title="$2"
  local description="$3"
  local category="$4"
  local has_root_index="$5"

  if [[ "$has_root_index" == "yes" ]]; then
    cat > "$target_dir/README.md" <<EOF_INNER
# ${title}

${description}。

- 类型：${category}
- 运行方式：直接用浏览器打开 \`index.html\`
EOF_INNER
  else
    cat > "$target_dir/README.md" <<EOF_INNER
# ${title}

${description}。

- 类型：${category}
- 运行方式：这是一个需要本地开发服务的工程项目，进入项目目录后运行 \`pnpm install\` 和 \`pnpm dev\`
EOF_INNER
  fi
}

write_complex_project_landing() {
  local target_dir="$1"
  local source_file="$2"
  local title="$3"
  local description="$4"
  local category="$5"
  local icon="$6"

  local escaped_source escaped_title escaped_description escaped_category escaped_icon
  escaped_source="$(printf "%s" "$source_file" | html_escape)"
  escaped_title="$(printf "%s" "$title" | html_escape)"
  escaped_description="$(printf "%s" "$description" | html_escape)"
  escaped_category="$(printf "%s" "$category" | html_escape)"
  escaped_icon="$(printf "%s" "$icon" | html_escape)"

  cat > "$target_dir/index.html" <<EOF_LANDING
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escaped_title}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f7fb;
      --ink: #172033;
      --muted: #617086;
      --panel: #ffffff;
      --line: #dbe3ef;
      --blue: #246bfe;
      --green: #12a875;
      --yellow: #f4b63d;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      background:
        linear-gradient(135deg, rgba(36, 107, 254, .10), transparent 32%),
        linear-gradient(315deg, rgba(18, 168, 117, .12), transparent 30%),
        var(--bg);
      font-family: ui-rounded, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
    }
    main {
      width: min(880px, calc(100% - 32px));
      margin: 0 auto;
      padding: 56px 0;
    }
    .panel {
      padding: 28px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(255, 255, 255, .88);
      box-shadow: 0 18px 50px rgba(30, 45, 80, .12);
    }
    .mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 58px;
      height: 58px;
      margin-bottom: 18px;
      border-radius: 16px;
      background: var(--blue);
      color: white;
      font-size: 30px;
    }
    h1 {
      margin: 0;
      font-size: clamp(34px, 6vw, 62px);
      line-height: 1;
      letter-spacing: 0;
    }
    .category {
      margin: 12px 0 0;
      color: var(--green);
      font-weight: 800;
    }
    p {
      max-width: 660px;
      margin: 18px 0 0;
      color: var(--muted);
      font-size: 18px;
      line-height: 1.8;
    }
    .steps {
      display: grid;
      gap: 12px;
      margin-top: 28px;
    }
    code {
      display: block;
      padding: 14px 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #101828;
      color: #f5f8ff;
      font-size: 15px;
      overflow-x: auto;
    }
    a {
      display: inline-flex;
      margin-top: 24px;
      color: var(--blue);
      font-weight: 800;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <main>
    <section class="panel">
      <div class="mark">${escaped_icon}</div>
      <h1>${escaped_title}</h1>
      <div class="category">${escaped_category}</div>
      <p>${escaped_description}。这个作品是前后端联机工程，不能只靠静态网页完整运行；作品集先展示项目入口和本地启动方式。</p>
      <div class="steps" aria-label="本地启动命令">
        <code>cd /Users/xjc/Developer/games/projects/${escaped_source}</code>
        <code>pnpm install</code>
        <code>pnpm dev</code>
      </div>
      <a href="../">返回作品集</a>
    </section>
  </main>
</body>
</html>
EOF_LANDING
}

sync_projects() {
  while IFS=$'\t' read -r source_file folder title description category icon _extra; do
    [[ -z "${source_file:-}" ]] && continue
    category="${category:-其他作品}"
    icon="${icon:-$(project_icon "$category")}"

    local source_path target_dir has_root_index
    source_path="$SOURCE_DIR/$source_file"
    target_dir="$TARGET_REPO/$folder"

    if [[ ! -e "$source_path" ]]; then
      echo "跳过：找不到 $source_path"
      continue
    fi

    mkdir -p "$target_dir"
    has_root_index="no"

    if [[ -d "$source_path" ]]; then
      rsync -a --delete \
        --exclude '.git/' \
        --exclude 'node_modules/' \
        --exclude 'dist/' \
        --exclude 'coverage/' \
        --exclude 'test-results/' \
        --exclude 'playwright-report/' \
        --exclude '.turbo/' \
        --exclude '.DS_Store' \
        --exclude '.env' \
        --exclude '.env.*' \
        "$source_path/." "$target_dir/"
      if [[ -f "$target_dir/index.html" ]]; then
        has_root_index="yes"
      else
        write_complex_project_landing "$target_dir" "$source_file" "$title" "$description" "$category" "$icon"
      fi
    else
      cp "$source_path" "$target_dir/index.html"
      has_root_index="yes"
    fi

    write_project_readme "$target_dir" "$title" "$description" "$category" "$has_root_index"
    echo "已同步：$source_file -> $folder"
  done < "$MAP_FILE"
}

has_category() {
  local wanted="$1"

  if [[ "$wanted" == "学习工具" ]]; then
    return 0
  fi

  while IFS=$'\t' read -r _source_file _folder _title _description category _icon _extra; do
    [[ -z "${_source_file:-}" ]] && continue
    category="${category:-其他作品}"
    if [[ "$category" == "$wanted" ]]; then
      return 0
    fi
  done < "$MAP_FILE"

  return 1
}

write_static_ai_readme_row() {
  printf '| 02 | [AI学习助手](./02-AI学习助手/) | 学习工具 | 🤖 | AI 驱动的学习助手，制定计划、跟踪进度、收集徽章 |\n' >> "$TARGET_REPO/README.md"
}

write_map_readme_rows_for_category() {
  local wanted="$1"

  while IFS=$'\t' read -r _source_file folder title description category icon _extra; do
    [[ -z "${_source_file:-}" ]] && continue
    category="${category:-其他作品}"
    icon="${icon:-$(project_icon "$category")}"
    if [[ "$category" != "$wanted" ]]; then
      continue
    fi

    local number
    number="${folder%%-*}"
    printf '| %s | [%s](./%s/) | %s | %s | %s |\n' "$number" "$title" "$folder" "$category" "$icon" "$description" >> "$TARGET_REPO/README.md"
  done < "$MAP_FILE"
}

write_readme() {
  cat > "$TARGET_REPO/README.md" <<'EOF_README'
# 小小开发者的作品集

这里存放着我独立开发的小项目，每个项目一个文件夹。首页已经按作品类型合并展示，方便快速找到同类游戏。

## 项目列表

| # | 项目 | 类型 | 图标 | 简介 |
|---|------|------|------|------|
EOF_README

  local categories category
  categories="学习工具 联机原型 动作原型 派对竞技 益智合成 棋类策略 纸牌合集 社交推理 音乐训练 其他作品"

  for category in $categories; do
    if ! has_category "$category"; then
      continue
    fi
    if [[ "$category" == "学习工具" ]]; then
      write_static_ai_readme_row
    fi
    write_map_readme_rows_for_category "$category"
  done

  cat >> "$TARGET_REPO/README.md" <<'EOF_README'

## 怎么运行

大多数作品可以直接打开对应文件夹里的 `index.html`。

像 `Space Hideout` 这样的联机工程需要在原项目目录运行：

```bash
cd /Users/xjc/Developer/games/projects/space-hideout
pnpm install
pnpm dev
```

更新作品后运行 `/Users/xjc/Developer/games/发布到作品集.command`。
EOF_README
}

project_count() {
  awk 'NF { count += 1 } END { print count + 1 }' "$MAP_FILE"
}

category_count() {
  {
    printf "学习工具\n"
    awk -F '\t' 'NF { if ($5 == "") print "其他作品"; else print $5 }' "$MAP_FILE"
  } | sort -u | wc -l | tr -d ' '
}

html_card() {
  local folder="$1"
  local title="$2"
  local description="$3"
  local category="$4"
  local icon="$5"
  local number="$6"

  local escaped_folder escaped_title escaped_description escaped_category escaped_icon escaped_number
  escaped_folder="$(printf "%s" "$folder" | html_escape)"
  escaped_title="$(printf "%s" "$title" | html_escape)"
  escaped_description="$(printf "%s" "$description" | html_escape)"
  escaped_category="$(printf "%s" "$category" | html_escape)"
  escaped_icon="$(printf "%s" "$icon" | html_escape)"
  escaped_number="$(printf "%s" "$number" | html_escape)"

  cat >> "$TARGET_REPO/index.html" <<EOF_CARD
        <a class="project-card" href="./${escaped_folder}/" aria-label="${escaped_title}">
          <span class="project-icon" aria-hidden="true">${escaped_icon}</span>
          <span class="project-meta">${escaped_category} · ${escaped_number}</span>
          <h3>${escaped_title}</h3>
          <p>${escaped_description}。</p>
        </a>
EOF_CARD
}

write_static_ai_card() {
  html_card "02-AI学习助手" "AI学习助手" "AI 驱动的学习助手，制定计划、跟踪进度、收集徽章" "学习工具" "🤖" "02"
}

write_map_cards_for_category() {
  local wanted="$1"

  while IFS=$'\t' read -r _source_file folder title description category icon _extra; do
    [[ -z "${_source_file:-}" ]] && continue
    category="${category:-其他作品}"
    icon="${icon:-$(project_icon "$category")}"
    if [[ "$category" != "$wanted" ]]; then
      continue
    fi

    local number
    number="${folder%%-*}"
    html_card "$folder" "$title" "$description" "$category" "$icon" "$number"
  done < "$MAP_FILE"
}

write_category_section() {
  local category="$1"
  local summary="$2"
  local icon
  icon="$(project_icon "$category")"

  if ! has_category "$category"; then
    return
  fi

  local escaped_category escaped_summary escaped_icon
  escaped_category="$(printf "%s" "$category" | html_escape)"
  escaped_summary="$(printf "%s" "$summary" | html_escape)"
  escaped_icon="$(printf "%s" "$icon" | html_escape)"

  cat >> "$TARGET_REPO/index.html" <<EOF_SECTION
      <section class="category-section" aria-labelledby="category-${escaped_category}">
        <div class="category-heading">
          <span class="category-icon" aria-hidden="true">${escaped_icon}</span>
          <div>
            <h2 id="category-${escaped_category}">${escaped_category}</h2>
            <p>${escaped_summary}</p>
          </div>
        </div>
        <div class="project-grid">
EOF_SECTION

  if [[ "$category" == "学习工具" ]]; then
    write_static_ai_card
  fi
  write_map_cards_for_category "$category"

  cat >> "$TARGET_REPO/index.html" <<'EOF_SECTION'
        </div>
      </section>
EOF_SECTION
}

write_index() {
  local total_projects total_categories
  total_projects="$(project_count)"
  total_categories="$(category_count)"

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
      --paper: #f4f7fb;
      --ink: #172033;
      --muted: #627086;
      --line: #d8e0ee;
      --card: #ffffff;
      --blue: #276ef1;
      --green: #0f9f72;
      --yellow: #f3ad32;
      --pink: #d94f70;
      --violet: #7357d8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      background:
        linear-gradient(90deg, rgba(39, 110, 241, .07) 1px, transparent 1px),
        linear-gradient(rgba(15, 159, 114, .07) 1px, transparent 1px),
        var(--paper);
      background-size: 30px 30px;
      font-family: ui-rounded, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
    }
    header, main, footer {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
    }
    header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 28px;
      align-items: end;
      padding: 44px 0 22px;
    }
    .label {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
      color: var(--muted);
      font-size: 14px;
      font-weight: 800;
    }
    .label-dot {
      flex: 0 0 54px;
      width: 54px;
      height: 12px;
      border-radius: 0;
      background:
        radial-gradient(circle at 6px 6px, var(--green) 0 6px, transparent 7px),
        radial-gradient(circle at 27px 6px, var(--yellow) 0 6px, transparent 7px),
        radial-gradient(circle at 48px 6px, var(--pink) 0 6px, transparent 7px);
    }
    h1 {
      max-width: 760px;
      margin: 0;
      font-size: clamp(38px, 7vw, 76px);
      line-height: 1;
      letter-spacing: 0;
    }
    h1 span {
      display: block;
    }
    .intro {
      max-width: 650px;
      margin: 18px 0 0;
      color: var(--muted);
      font-size: clamp(16px, 2vw, 19px);
      line-height: 1.75;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(110px, 1fr));
      gap: 10px;
      min-width: 250px;
    }
    .stat {
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(255, 255, 255, .78);
    }
    .stat strong {
      display: block;
      font-size: 28px;
      line-height: 1;
    }
    .stat span {
      display: block;
      margin-top: 6px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 700;
    }
    main {
      display: grid;
      gap: 24px;
      padding: 18px 0 54px;
    }
    .category-section {
      padding-top: 10px;
    }
    .category-heading {
      display: flex;
      gap: 14px;
      align-items: center;
      margin-bottom: 12px;
    }
    .category-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      border-radius: 8px;
      color: white;
      background: var(--blue);
      font-size: 24px;
      box-shadow: 4px 4px 0 rgba(23, 32, 51, .14);
    }
    .category-section:nth-child(2n) .category-icon { background: var(--green); }
    .category-section:nth-child(3n) .category-icon { background: var(--yellow); }
    .category-section:nth-child(4n) .category-icon { background: var(--pink); }
    .category-section:nth-child(5n) .category-icon { background: var(--violet); }
    h2 {
      margin: 0;
      font-size: 25px;
      letter-spacing: 0;
    }
    .category-heading p {
      margin: 5px 0 0;
      color: var(--muted);
      line-height: 1.55;
    }
    .project-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 360px));
      gap: 14px;
      justify-content: start;
    }
    .project-card {
      display: grid;
      grid-template-rows: auto auto auto 1fr;
      min-height: 220px;
      padding: 18px;
      border: 1px solid var(--line);
      border-radius: 8px;
      color: inherit;
      background: var(--card);
      box-shadow: 0 12px 28px rgba(23, 32, 51, .08);
      text-decoration: none;
      transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
    }
    .project-card:hover,
    .project-card:focus-visible {
      transform: translateY(-3px);
      border-color: rgba(39, 110, 241, .55);
      box-shadow: 0 18px 36px rgba(23, 32, 51, .14);
      outline: none;
    }
    .project-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      margin-bottom: 14px;
      border-radius: 8px;
      background: #edf3ff;
      font-size: 29px;
    }
    .project-meta {
      color: var(--muted);
      font-size: 13px;
      font-weight: 800;
    }
    h3 {
      margin: 8px 0 0;
      font-size: 22px;
      line-height: 1.2;
      letter-spacing: 0;
    }
    .project-card p {
      margin: 10px 0 0;
      color: var(--muted);
      line-height: 1.65;
    }
    footer {
      padding: 0 0 38px;
      color: var(--muted);
      font-size: 14px;
    }
    @media (max-width: 760px) {
      header {
        grid-template-columns: 1fr;
      }
      .stats {
        min-width: 0;
        max-width: 360px;
      }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <div class="label"><span class="label-dot"></span>作品集</div>
      <h1><span>小小开发者的游戏</span><span>和学习工具</span></h1>
      <p class="intro">这里收藏孩子用 AI 和代码做出来的小项目。现在按类型合并展示，每个作品都有图标、简介和独立入口。</p>
    </div>
    <div class="stats" aria-label="作品集统计">
      <div class="stat"><strong>__PROJECT_COUNT__</strong><span>个作品</span></div>
      <div class="stat"><strong>__CATEGORY_COUNT__</strong><span>个类型</span></div>
    </div>
  </header>

  <main>
EOF_INDEX

  perl -0pi -e "s/__PROJECT_COUNT__/$total_projects/g; s/__CATEGORY_COUNT__/$total_categories/g" "$TARGET_REPO/index.html"

  write_category_section "学习工具" "复习、识字、钢琴和 AI 学习辅助都放在这里。"
  write_category_section "联机原型" "多人联机、房间、AI 决策这类工程型游戏。"
  write_category_section "动作原型" "移动、瞄准、探索和战斗循环练习。"
  write_category_section "派对竞技" "适合短时间重复游玩、看局势变化的本地游戏。"
  write_category_section "益智合成" "规则简单、目标清楚，适合练习策略和观察。"
  write_category_section "棋类策略" "需要提前思考和复盘的策略桌面游戏。"
  write_category_section "纸牌合集" "用扑克牌规则做出来的小玩法集合。"
  write_category_section "社交推理" "多人轮流操作、观察发言和判断身份的作品。"
  write_category_section "音乐训练" "把音乐练习拆成更容易坚持的小关卡。"
  write_category_section "其他作品" "暂时还没归到固定类型里的项目。"

  cat >> "$TARGET_REPO/index.html" <<'EOF_INDEX'
  </main>

  <footer>更新作品后运行发布脚本，作品集会重新整理首页和项目文件。</footer>
</body>
</html>
EOF_INDEX
}

append_new_projects_to_map
sync_projects
write_readme
write_index

cd "$TARGET_REPO"

if [[ "$PUBLISH_SKIP_GIT" == "1" ]]; then
  echo "已完成本地同步和页面生成，已按设置跳过 Git 提交和推送。"
  exit 0
fi

git add .gitignore AGENTS.md MEMORY.md README.md index.html scripts/publish-games.sh scripts/publish-map.tsv [0-9][0-9]-*

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
