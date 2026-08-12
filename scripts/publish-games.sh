#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="/Users/xjc/Developer/games/projects"
SOURCE_ROOTS=(
  "/Users/xjc/Developer/games/projects"
  "/Users/xjc/Developer/games"
)
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
  {
    find "$TARGET_REPO" -maxdepth 1 -type d -name '[0-9][0-9]-*' -print \
      | sed -E 's#.*/([0-9][0-9])-.*#\1#'
    awk -F '\t' 'NF { split($2, parts, "-"); if (parts[1] ~ /^[0-9][0-9]$/) print parts[1] }' "$MAP_FILE"
  } | sort -n | tail -1 | awk '{ printf "%02d", $1 + 1 }'
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
    blast-grid-arena) printf "原创炸弹迷宫派对竞技场，支持本地多人、AI 补位、道具和手机摇杆" ;;
    space-hideout) printf "可直接游玩的原创太空躲藏试玩：逃离猎手、修复终端并存活到倒计时结束" ;;
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

find_source_path() {
  local source_file="$1"
  local root candidate

  for root in "${SOURCE_ROOTS[@]}"; do
    candidate="$root/$source_file"
    if [[ -e "$candidate" ]]; then
      printf "%s" "$candidate"
      return 0
    fi
  done

  return 1
}

is_source_root_project_candidate() {
  local source_path="$1"
  local source_file
  source_file="$(basename "$source_path")"

  case "$source_file" in
    projects|resources|scripts|node_modules|.git|.codex|.agents)
      return 1
      ;;
    *.command|AGENTS.md|MEMORY.md|README.md|.DS_Store)
      return 1
      ;;
  esac

  return 0
}

clean_generated_junk() {
  local target_dir="$1"

  rm -rf \
    "$target_dir/AGENTS.md" \
    "$target_dir/MEMORY.md" \
    "$target_dir/node_modules" \
    "$target_dir/dist" \
    "$target_dir/coverage" \
    "$target_dir/test-results" \
    "$target_dir/playwright-report" \
    "$target_dir/.turbo"
}

append_new_projects_to_map() {
  for root in "${SOURCE_ROOTS[@]}"; do
    [[ -d "$root" ]] || continue
    find "$root" -mindepth 1 -maxdepth 1 \( -type f -name '*.html' -o -type d \) -print | sort
  done | while read -r source_path; do
    local source_file title number folder description category icon
    source_file="$(basename "$source_path")"

    if ! is_source_root_project_candidate "$source_path"; then
      continue
    fi

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
    title="${title//|/·}"

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
      color-scheme: dark;
      --bg: #061318;
      --panel: rgba(11, 31, 39, .9);
      --panel-soft: rgba(14, 42, 50, .72);
      --ink: #eefaf8;
      --muted: #9fc6c1;
      --line: rgba(49, 216, 200, .28);
      --blue: #31d8c8;
      --green: #7ed957;
      --yellow: #f4b63d;
      --red: #ef5d75;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      background:
        radial-gradient(circle at 16% 18%, rgba(49, 216, 200, .20), transparent 28%),
        radial-gradient(circle at 86% 12%, rgba(244, 182, 61, .14), transparent 24%),
        linear-gradient(90deg, rgba(49, 216, 200, .06) 1px, transparent 1px) 0 0 / 34px 34px,
        linear-gradient(rgba(126, 217, 87, .05) 1px, transparent 1px) 0 0 / 34px 34px,
        var(--bg);
      font-family: ui-rounded, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
    }
    main {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
      padding: 38px 0;
    }
    .deck {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: 18px;
      align-items: stretch;
    }
    .panel,
    .visual {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: 0 22px 60px rgba(0, 0, 0, .28);
    }
    .panel {
      padding: 30px;
    }
    .mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 58px;
      height: 58px;
      margin-bottom: 18px;
      border-radius: 8px;
      background: var(--blue);
      color: #041114;
      font-size: 30px;
    }
    h1 {
      margin: 0;
      font-size: 62px;
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
      font-size: 17px;
      line-height: 1.8;
    }
    .launcher {
      display: grid;
      gap: 10px;
      margin-top: 28px;
    }
    label {
      color: var(--yellow);
      font-size: 13px;
      font-weight: 800;
    }
    .launcher-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 92px 112px;
      gap: 10px;
    }
    input,
    button {
      min-height: 44px;
      border: 1px solid var(--line);
      border-radius: 8px;
      font: inherit;
    }
    input {
      min-width: 0;
      padding: 0 14px;
      color: var(--ink);
      background: rgba(2, 12, 16, .78);
    }
    button {
      cursor: pointer;
      color: #041114;
      background: var(--blue);
      font-weight: 900;
    }
    button.secondary {
      color: var(--ink);
      background: rgba(49, 216, 200, .12);
    }
    .message {
      min-height: 24px;
      margin: 0;
      color: var(--muted);
      font-size: 14px;
    }
    .steps {
      display: grid;
      gap: 10px;
      margin-top: 20px;
    }
    .step {
      padding: 14px 16px;
      border: 1px solid rgba(159, 198, 193, .18);
      border-radius: 8px;
      background: var(--panel-soft);
      color: var(--muted);
      line-height: 1.6;
    }
    code {
      display: block;
      margin-top: 8px;
      padding: 12px 14px;
      border: 1px solid rgba(49, 216, 200, .2);
      border-radius: 8px;
      background: #101828;
      color: #f5f8ff;
      font-size: 14px;
      overflow-x: auto;
    }
    .visual {
      position: relative;
      min-height: 520px;
      overflow: hidden;
      background:
        radial-gradient(circle at center, rgba(49, 216, 200, .12), transparent 36%),
        rgba(6, 19, 24, .92);
    }
    .orbit {
      position: absolute;
      inset: 58px 34px;
      border: 1px solid rgba(49, 216, 200, .26);
      border-radius: 50%;
      animation: turn 14s linear infinite;
    }
    .orbit::before,
    .orbit::after {
      position: absolute;
      content: "";
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--yellow);
    }
    .orbit::before { top: 20px; left: 64px; }
    .orbit::after { right: 32px; bottom: 72px; background: var(--red); }
    .crew {
      position: absolute;
      left: 142px;
      top: 180px;
      width: 58px;
      height: 82px;
      border-radius: 26px 26px 20px 20px;
      background: var(--blue);
      box-shadow: inset -12px -14px 0 rgba(0, 0, 0, .16);
      animation: bob 2.6s ease-in-out infinite;
    }
    .crew::before {
      position: absolute;
      right: -8px;
      top: 20px;
      width: 34px;
      height: 22px;
      content: "";
      border-radius: 12px;
      background: linear-gradient(135deg, #d9fffb, #438fb0);
    }
    .chips {
      position: absolute;
      left: 24px;
      right: 24px;
      bottom: 24px;
      display: grid;
      gap: 10px;
    }
    .chip {
      padding: 12px 14px;
      border: 1px solid rgba(159, 198, 193, .18);
      border-radius: 8px;
      background: rgba(2, 12, 16, .7);
      color: var(--muted);
      font-weight: 800;
    }
    a {
      display: inline-flex;
      margin-top: 24px;
      color: var(--blue);
      font-weight: 800;
      text-decoration: none;
    }
    @keyframes turn {
      to { transform: rotate(360deg); }
    }
    @keyframes bob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @media (max-width: 820px) {
      .deck { grid-template-columns: 1fr; }
      h1 { font-size: 46px; }
      .launcher-row { grid-template-columns: 1fr; }
      .visual { min-height: 360px; }
    }
    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 1ms !important; animation-iteration-count: 1 !important; }
    }
  </style>
</head>
<body>
  <main>
    <div class="deck">
      <section class="panel">
        <div class="mark">${escaped_icon}</div>
        <h1>${escaped_title}</h1>
        <div class="category">${escaped_category}</div>
        <p>${escaped_description}。这是前后端联机工程：先启动本机程序，再用下面的网址进入游戏。</p>
        <form class="launcher" id="launcher-form">
          <label for="game-url">游戏网址</label>
          <div class="launcher-row">
            <input id="game-url" type="url" value="http://127.0.0.1:5173">
            <button type="submit">打开</button>
            <button class="secondary" id="check-button" type="button">检测</button>
          </div>
          <p class="message" id="message">如果页面打不开，先双击启动器。</p>
        </form>
        <div class="steps">
          <div class="step">1. 双击启动器
            <code>/Users/xjc/Developer/games/启动 Space Hideout.command</code>
          </div>
          <div class="step">2. 或者手动启动
            <code>cd /Users/xjc/Developer/games/projects/${escaped_source}</code>
            <code>pnpm dev</code>
          </div>
        </div>
        <a href="../">返回作品集</a>
      </section>
      <aside class="visual" aria-label="游戏预览">
        <div class="orbit"></div>
        <div class="crew"></div>
        <div class="chips">
          <div class="chip">外观：颜色、帽子、面罩预览</div>
          <div class="chip">AI：BOT 船员和猎手决策地基</div>
          <div class="chip">动画：巡逻、扫描、启动反馈</div>
        </div>
      </aside>
    </div>
  </main>
  <script>
    const form = document.querySelector("#launcher-form");
    const input = document.querySelector("#game-url");
    const message = document.querySelector("#message");
    const checkButton = document.querySelector("#check-button");

    function currentUrl() {
      try {
        return new URL(input.value.trim()).toString();
      } catch {
        message.textContent = "网址格式不对，可以试试 http://127.0.0.1:5173";
        return null;
      }
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const url = currentUrl();
      if (!url) return;
      window.open(url, "_blank", "noopener,noreferrer");
      message.textContent = "已尝试打开游戏网址。";
    });

    checkButton.addEventListener("click", async () => {
      const url = currentUrl();
      if (!url) return;
      message.textContent = "正在检测本机游戏服务...";
      try {
        await fetch(url, { mode: "no-cors", cache: "no-store" });
        message.textContent = "检测到游戏服务，可以点击打开。";
      } catch {
        message.textContent = "还没有检测到游戏服务，请先双击启动器。";
      }
    });
  </script>
</body>
</html>
EOF_LANDING
}

build_space_hideout_demo() {
  local source_path="$1"
  local target_dir="$2"
  local dist_dir="$source_path/apps/client/dist"
  local assets_dir="$target_dir/assets"

  if ! command -v pnpm >/dev/null 2>&1; then
    echo "无法发布 Space Hideout：没有找到 pnpm。"
    return 1
  fi

  echo "正在构建 Space Hideout 在线试玩版..."
  (
    cd "$source_path"
    pnpm --filter @space-hideout/shared build
    VITE_STATIC_DEMO=1 pnpm --filter @space-hideout/client build
  )

  if [[ ! -f "$dist_dir/index.html" ]]; then
    echo "无法发布 Space Hideout：前端构建没有生成 index.html。"
    return 1
  fi

  mkdir -p "$assets_dir"
  rsync -a --delete "$dist_dir/assets/" "$assets_dir/"
  cp "$dist_dir/index.html" "$target_dir/index.html"
}

write_space_hideout_online_landing() {
  local target_dir="$1"
  local title="$2"
  local description="$3"

  local escaped_title escaped_description
  escaped_title="$(printf "%s" "$title" | html_escape)"
  escaped_description="$(printf "%s" "$description" | html_escape)"

  cat > "$target_dir/index.html" <<EOF_LANDING
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escaped_title}</title>
  <style>
    :root { color-scheme: dark; --void: #061318; --line: #31d8c8; --ink: #eefaf8; --muted: #9fc6c1; }
    * { box-sizing: border-box; }
    body {
      min-width: 960px;
      min-height: 100vh;
      margin: 0;
      color: var(--ink);
      background:
        linear-gradient(90deg, rgba(49, 216, 200, .06) 1px, transparent 1px) 0 0 / 42px 42px,
        linear-gradient(rgba(244, 192, 95, .04) 1px, transparent 1px) 0 0 / 42px 42px,
        var(--void);
      font-family: ui-rounded, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      min-height: 66px;
      padding: 12px max(24px, calc((100% - 1180px) / 2));
      border-bottom: 1px solid rgba(49, 216, 200, .22);
      background: rgba(6, 19, 24, .86);
    }
    h1 { margin: 0; font-size: 22px; letter-spacing: 0; }
    p { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
    a {
      flex: 0 0 auto;
      color: #041114;
      background: var(--line);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 14px;
      font-weight: 900;
      text-decoration: none;
    }
    main { height: calc(100vh - 66px); min-height: 720px; }
    iframe { display: block; width: 100%; height: 100%; border: 0; background: var(--void); }
    @media (max-width: 1080px) {
      body { min-width: 0; }
      header { align-items: flex-start; padding: 14px 18px; }
      main { min-height: 760px; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>${escaped_title} · 在线试玩</h1>
      <p>${escaped_description}</p>
    </div>
    <a href="./online-demo/" target="_blank" rel="noopener">全屏打开</a>
  </header>
  <main>
    <iframe src="./online-demo/" title="Space Hideout 在线试玩"></iframe>
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
    if ! source_path="$(find_source_path "$source_file")"; then
      echo "跳过：找不到 $source_file。请确认源项目没有被移动或删除。"
      continue
    fi
    target_dir="$TARGET_REPO/$folder"

    mkdir -p "$target_dir"
    has_root_index="no"

    if [[ -d "$source_path" ]]; then
      if [[ "$source_file" == "space-hideout" ]]; then
        clean_generated_junk "$target_dir"
        if build_space_hideout_demo "$source_path" "$target_dir"; then
          has_root_index="yes"
        elif [[ -f "$target_dir/index.html" ]]; then
          echo "保留 Space Hideout 上一次成功发布的在线试玩版。"
          has_root_index="yes"
        else
          write_complex_project_landing "$target_dir" "$source_file" "$title" "$description" "$category" "$icon"
        fi
        write_project_readme "$target_dir" "$title" "$description" "$category" "$has_root_index"
        echo "已同步：$source_file -> $folder"
        continue
      fi

      clean_generated_junk "$target_dir"
      rsync -a --delete \
        --exclude '.git/' \
        --exclude 'node_modules/' \
        --exclude 'dist/' \
        --exclude 'coverage/' \
        --exclude 'test-results/' \
        --exclude 'playwright-report/' \
        --exclude '.turbo/' \
        --exclude '_archive/' \
        --exclude '.DS_Store' \
        --exclude 'AGENTS.md' \
        --exclude 'MEMORY.md' \
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

`Space Hideout` 可以在作品集中直接运行线上试玩版：

```text
https://xxby.carlxu.cn/11-Space%20Hideout/
```

完整多人联机仍可在本机用启动器运行：

```text
/Users/xjc/Developer/games/启动 Space Hideout.command
```

也可以在原项目目录手动运行：

```bash
cd /Users/xjc/Developer/games/projects/space-hideout
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
