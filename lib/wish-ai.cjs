const { createHash } = require('node:crypto');

const limitScript = `
for i=1,#KEYS do
  if tonumber(redis.call('GET', KEYS[i]) or '0') >= tonumber(ARGV[i]) then return 0 end
end
for i=1,#KEYS do
  if redis.call('INCR', KEYS[i]) == 1 and tonumber(ARGV[i+#KEYS]) > 0 then
    redis.call('EXPIRE', KEYS[i], ARGV[i+#KEYS])
  end
end
return 1
`;

const goals = { fireflies: [10, 24], 'star-courier': [4, 14], vault: [3, 5] };
const palettes = ['aurora', 'gold', 'nebula'];
const memoryCounts = new Map();
let lastPrunedMinute;
const outputRules = '只返回一个 JSON 对象，不要 Markdown 或代码。字段：title（游戏名，12字内），template（fireflies 节奏 / star-courier 航道 / vault 记忆，使用英文值），palette（aurora / gold / nebula），difficulty（1 到 3 整数），goal（节奏10–24次命中；航道4–14颗星核；记忆3–5轮），pitch（核心玩法一句话），choice（做了哪项设计选择），reason（这项设计如何影响玩家体验），nextPrompt（下一轮可直接发送给 AI 的具体改法）。后四项每项90字内。根据用户需求选最近的机制，如果需求超出三种机制，说明当前原型能实现的部分。面向12岁，内容健康，不索要个人信息，不输出外部链接。设计说明只给具体的选择与可观察的效果。遇到不合适的请求返回 {"rewrite":true}。';

function resolveEndpoint(base) {
  try {
    const url = new URL(base.trim());
    const localHttp = !process.env.VERCEL && url.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !localHttp) || url.username || url.password) return null;
    const path = url.pathname.replace(/\/+$/, '');
    url.pathname = path.endsWith('/chat/completions') ? path : (path || '/v1') + '/chat/completions';
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

function envValue(...names) {
  return names.map(name => process.env[name]?.trim()).find(Boolean);
}

function resolveConfig() {
  const endpoint = resolveEndpoint(envValue('AI_API_BASE', 'WISH_API_BASE', 'WISH_API_URL', 'OPENAI_API_BASE', 'OPENAI_BASE_URL'));
  const key = envValue('AI_API_KEY', 'WISH_API_KEY', 'OPENAI_API_KEY');
  const model = envValue('AI_MODEL', 'WISH_AI_MODEL', 'OPENAI_MODEL') || 'gpt-4o-mini';
  return endpoint && key ? { endpoint, key, model } : null;
}

function isConfigured() {
  return Boolean(resolveConfig());
}

function positiveInt(value, fallback) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : fallback;
}

function memoryQuota(windows, now, minute) {
  if (lastPrunedMinute !== minute) {
    for (const [key, entry] of memoryCounts) {
      if (entry.expires <= now) memoryCounts.delete(key);
    }
    lastPrunedMinute = minute;
  }
  if (windows.some(([key, limit]) => (memoryCounts.get(key)?.count || 0) >= limit)) return false;
  for (const [key, , ttl] of windows) {
    const entry = memoryCounts.get(key);
    if (entry) entry.count++;
    else memoryCounts.set(key, { count: 1, expires: ttl ? now + ttl * 1000 : Infinity });
  }
  return true;
}

async function quota(visitor) {
  const endpoint = envValue('BIRTHDAY_REDIS_URL');
  const token = envValue('BIRTHDAY_REDIS_TOKEN');
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const parts = new Intl.DateTimeFormat('en-CA', { dateStyle: 'short', timeZone: 'Asia/Hong_Kong' }).format(new Date(now));
  const day = parts.replaceAll(/[^\d]/g, '-');
  const prefix = 'birthday-wish:' + (process.env.BIRTHDAY_DATE || '2026-11-28');
  const ip = createHash('sha256').update(visitor || 'unknown').digest('hex');
  const windows = [
    [prefix + ':minute:' + minute, positiveInt(process.env.AI_MINUTE_LIMIT, 3), 120],
    [prefix + ':day:' + day, positiveInt(process.env.AI_DAILY_LIMIT, 20), 172800],
    [prefix + ':total', positiveInt(process.env.AI_TOTAL_LIMIT, 60), 0],
    [prefix + ':ip:' + ip + ':minute:' + minute, 3, 120],
    [prefix + ':ip:' + ip + ':day:' + day, 15, 172800],
  ];
  if (!endpoint || !token) return memoryQuota(windows, now, minute);

  const response = await fetch(endpoint, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(2200),
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(['EVAL', limitScript, windows.length,
      ...windows.map(([key]) => key), ...windows.map(([, limit]) => limit), ...windows.map(([, , ttl]) => ttl)]),
  });
  if (!response.ok) throw Error('quota service');
  const { result } = await response.json();
  if (result !== 0 && result !== 1) throw Error('quota response');
  return result === 1;
}

const disallowedText = /[<>]|https?:|www\.|(?<![a-z0-9-])(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|cn|net|org|io|app|dev|me|co|tv|gg|xyz|top|site|info|cc|vip|edu|gov|ai|hk|tw|uk|jp)(?![a-z0-9-])/i;

function clean(value, limit, truncate = false) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text || disallowedText.test(text)) return null;
  if (text.length <= limit) return text;
  if (!truncate) return null;
  const end = /[\uD800-\uDBFF]/.test(text[limit - 1]) ? limit - 1 : limit;
  return text.slice(0, end).trimEnd();
}

function gameNumber(value, min, max, normalize) {
  if (normalize && typeof value === 'string' && value.trim()) value = Number(value);
  if (!Number.isFinite(value)) return null;
  if (normalize) return Math.max(min, Math.min(max, Math.round(value)));
  return Number.isInteger(value) && value >= min && value <= max ? value : null;
}

function game(value, normalize = false) {
  if (!value || typeof value.template !== 'string' || !Object.hasOwn(goals, value.template) || !palettes.includes(value.palette)) return null;
  const [min, max] = goals[value.template];
  const difficulty = gameNumber(value.difficulty, 1, 3, normalize);
  const goal = gameNumber(value.goal, min, max, normalize);
  if (difficulty === null || goal === null) return null;
  const fields = {
    title: clean(value.title, 16, normalize), pitch: clean(value.pitch, 90, normalize),
    choice: clean(value.choice, 90, normalize), reason: clean(value.reason, 90, normalize),
    nextPrompt: clean(value.nextPrompt, 90, normalize),
  };
  if (Object.values(fields).some(value => !value)) return null;
  return { ...fields, template: value.template, palette: value.palette, difficulty, goal };
}

function parseContent(content) {
  const text = Array.isArray(content) ? content.filter(part => part?.type === 'text' &&
    typeof part.text === 'string').map(part => part.text).join('') : content;
  if (typeof text !== 'string' || text.length > 65536) throw Error('provider output');
  // Keep quoted field values intact so validation can reject disallowed text.
  const source = text.replace(/<think\b[^>]*>[\s\S]*?<\/think\s*>|"(?:\\[\s\S]|[^"\\])*"/gi,
    match => match.startsWith('"') ? match : '').replace(/^\s*\x60{3}(?:json)?\s*$/gim, '');
  const start = source.indexOf('{');
  let depth = 0;
  let quoted = false;
  for (let index = start; start !== -1 && index < source.length; index++) {
    const char = source[index];
    if (quoted && char === '\\') index++;
    else if (char === '"') quoted = !quoted;
    else if (!quoted && char === '{') depth++;
    else if (!quoted && char === '}' && --depth === 0) return JSON.parse(source.slice(start, index + 1));
  }
  throw Error('provider JSON');
}

async function generate(fields, visitor) {
  const idea = clean(fields?.idea, 240);
  const original = fields?.original == null ? null : game(fields.original);
  if (!idea) return [400, { message: '请输入一句简短的点子或修改要求。' }];
  const config = resolveConfig();
  if (!config) return [503, { code: 'unconfigured', message: '许愿 AI 接口参数尚未配置，请在 Vercel 后台设置 AI_API_BASE 与 AI_API_KEY。' }];
  try {
    if (!(await quota(visitor))) return [429, { code: 'quota', message: '这段时间的生成次数用完了，可以先试玩现有作品。' }];
    const { endpoint, key, model } = config;
    const payload = {
      model, max_tokens: 850, temperature: 0.7,
      messages: [
        { role: 'system', content: outputRules },
        { role: 'user', content: JSON.stringify({ request: idea, previousPrototype: original }) },
      ],
    };
    const signal = AbortSignal.timeout(15500);
    const request = data => fetch(endpoint, {
      method: 'POST', redirect: 'error', signal,
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    let result = await request({ ...payload, response_format: { type: 'json_object' } });
    if ([400, 422].includes(result.status)) {
      await result.body?.cancel();
      result = await request(payload);
    }
    if (!result.ok) {
      await result.body?.cancel();
      if ([401, 403].includes(result.status)) return [502, { code: 'upstream_auth', message: 'AI 密钥鉴权未通过，请检查 Vercel 后台的 AI_API_KEY 配置。' }];
      if (result.status === 404) return [502, { code: 'upstream_model', message: 'AI 接口地址或模型未匹配，请检查 Vercel 后台的 AI_API_BASE 与 AI_MODEL 配置。' }];
      throw Error('provider');
    }
    const value = parseContent((await result.json()).choices?.[0]?.message?.content);
    if (value.rewrite === true) return [422, { message: '换个适合大家试玩的点子吧，比如做一关太空运输。' }];
    const output = game(value, true);
    if (!output) throw Error('schema');
    return [200, output];
  } catch {
    return [503, { code: 'upstream_error', message: 'AI 暂时没有返回可玩的方案，请稍后重试或打开示例。' }];
  }
}

module.exports = { generate, isConfigured, resolveEndpoint };
