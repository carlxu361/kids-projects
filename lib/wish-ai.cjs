const { createHmac, randomUUID } = require('node:crypto');

const reserveScript = `
local n = #KEYS - 1
for i=1,n do
  if tonumber(redis.call('GET', KEYS[i+1]) or '0') >= tonumber(ARGV[i+1]) then return -i end
end
redis.call('SET', KEYS[1], '1', 'EX', tonumber(ARGV[1]))
local count
for i=1,n do
  count = redis.call('INCR', KEYS[i+1])
  if count == 1 and tonumber(ARGV[i+1+n]) > 0 then
    redis.call('EXPIRE', KEYS[i+1], ARGV[i+1+n])
  end
end
return count
`;

const releaseScript = `
if redis.call('DEL', KEYS[1]) == 0 then return 0 end
for i=2,#KEYS do
  if tonumber(redis.call('GET', KEYS[i]) or '0') > 0 then
    redis.call('DECR', KEYS[i])
  end
end
return 1
`;

const goals = { fireflies: [10, 24], 'star-courier': [4, 14], vault: [3, 5] };
const defaultGoals = { fireflies: 18, 'star-courier': 8, vault: 4 };
const palettes = ['aurora', 'gold', 'nebula'];
const memoryCounts = new Map();
const memoryReservations = new Set();
let lastPrunedMinute;
const outputRules = '直接输出且只输出一个合法 JSON 对象。不要解释、Markdown、代码围栏、尖括号 < >、网址或域名。字段：title（游戏名，12字内），template（fireflies 节奏 / star-courier 航道 / vault 记忆，使用英文值），palette（aurora / gold / nebula），difficulty（1 到 3 整数），goal（节奏10–24次命中；航道4–14颗星核；记忆3–5轮），pitch（核心玩法一句话），choice（做了哪项设计选择），reason（这项设计如何影响玩家体验），nextPrompt（下一轮可直接发送给 AI 的具体改法）。后四项每项90字内。根据用户需求选最近的机制，如果需求超出三种机制，说明当前原型能实现的部分。面向12岁，内容健康，不索要个人信息，不输出外部链接。设计说明只给具体的选择与可观察的效果。遇到不合适的请求返回 {"rewrite":true}。';

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
  return endpoint && key ? { endpoint, key, model, host: new URL(endpoint).hostname } : null;
}

function isConfigured() {
  return Boolean(resolveConfig());
}

function positiveInt(value, fallback) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : fallback;
}

function quotaContext(visitor) {
  const endpoint = envValue('BIRTHDAY_REDIS_URL');
  const token = envValue('BIRTHDAY_REDIS_TOKEN');
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(now));
  const prefix = '{birthday-wish:' + (process.env.VERCEL_ENV || 'local') + ':' +
    (process.env.BIRTHDAY_DATE || '2026-11-28') + '}';
  const secret = token || process.env.BIRTHDAY_SESSION_SECRET || 'birthday-wish';
  const ip = createHmac('sha256', secret).update(visitor || 'unknown').digest('hex');
  const limit = positiveInt(process.env.AI_IP_LIMIT, 3);
  const windows = [
    [prefix + ':minute:' + minute, positiveInt(process.env.AI_MINUTE_LIMIT, 3), 120],
    [prefix + ':day:' + day, positiveInt(process.env.AI_DAILY_LIMIT, 20), 172800],
    [prefix + ':total', positiveInt(process.env.AI_TOTAL_LIMIT, 60), 0],
    [prefix + ':ip:' + ip + ':minute:' + minute, positiveInt(process.env.AI_IP_MINUTE_LIMIT, 3), 120],
    [prefix + ':ip:' + ip + ':total', limit, 0],
  ];
  const resKey = prefix + ':res:' + randomUUID();
  return { endpoint, token, now, minute, limit, windows, resKey, ipKey: windows.at(-1)[0] };
}

function memoryQuota({ windows, resKey, now, minute }) {
  if (lastPrunedMinute !== minute) {
    for (const [key, entry] of memoryCounts) {
      if (entry.expires <= now) memoryCounts.delete(key);
    }
    lastPrunedMinute = minute;
  }
  const blocked = windows.findIndex(([key, limit]) => (memoryCounts.get(key)?.count || 0) >= limit);
  if (blocked !== -1) return -(blocked + 1);
  memoryReservations.add(resKey);
  for (const [key, , ttl] of windows) {
    const entry = memoryCounts.get(key);
    if (entry) entry.count++;
    else memoryCounts.set(key, { count: 1, expires: ttl ? now + ttl * 1000 : Infinity });
  }
  return memoryCounts.get(windows.at(-1)[0]).count;
}

function useRedis({ endpoint, token }) {
  if (!endpoint && !token && !process.env.VERCEL) return false;
  if (!endpoint || !token) throw Error('quota configuration');
  return true;
}

async function redisCommand({ endpoint, token }, command) {
  const response = await fetch(endpoint, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(2200),
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw Error('quota service');
  }
  const data = await response.json();
  if (data.error || !Object.hasOwn(data, 'result')) throw Error('quota response');
  return data.result;
}

async function reserve(context) {
  if (!useRedis(context)) return memoryQuota(context);
  const { windows, limit, resKey } = context;
  const result = await redisCommand(context, ['EVAL', reserveScript, windows.length + 1,
    resKey, ...windows.map(([key]) => key), 120,
    ...windows.map(([, windowLimit]) => windowLimit), ...windows.map(([, , ttl]) => ttl)]);
  if (!Number.isSafeInteger(result) || result === 0 || result < -windows.length || result > limit) {
    throw Error('quota reservation');
  }
  return result;
}

async function release(context) {
  const keys = context.windows.map(([key]) => key);
  if (useRedis(context)) {
    const result = await redisCommand(context, ['EVAL', releaseScript, keys.length + 1, context.resKey, ...keys]);
    if (result !== 0 && result !== 1) throw Error('quota release');
  } else if (memoryReservations.delete(context.resKey)) {
    for (const key of keys) {
      const entry = memoryCounts.get(key);
      if (entry?.count > 0) entry.count--;
    }
  }
}

function quotaStatus(limit, used) {
  return { limit, used, remaining: used === null ? null : Math.max(0, limit - used) };
}

async function readQuotaStatus(context) {
  const { limit, ipKey } = context;
  try {
    if (!useRedis(context)) return quotaStatus(limit, memoryCounts.get(ipKey)?.count ?? 0);
    const result = await redisCommand(context, ['GET', ipKey]);
    const used = result === null ? 0 : /^\d+$/.test(String(result)) ? Number(result) : NaN;
    if (!Number.isSafeInteger(used)) throw Error('quota counter');
    return quotaStatus(limit, used);
  } catch {
    logFailure('quota_status', resolveConfig(), 'quota_unavailable');
    return quotaStatus(limit, null);
  }
}

async function getQuotaStatus(visitor) {
  return readQuotaStatus(quotaContext(visitor));
}

const disallowedText = /[<>]|https?:|www\.|(?<![a-z0-9-])(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?![a-z0-9-])/i;

function clean(value, limit, truncate = false) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text || disallowedText.test(text)) return null;
  if (text.length <= limit) return text;
  if (!truncate) return null;
  const end = /[\uD800-\uDBFF]/.test(text[limit - 1]) ? limit - 1 : limit;
  return text.slice(0, end).trimEnd();
}

function gameNumber(value, min, max, fallback) {
  if (fallback === undefined) return Number.isInteger(value) && value >= min && value <= max ? value : null;
  if (typeof value === 'string') {
    const text = value.trim();
    value = text && Number.isFinite(Number(text)) ? Number(text) : Number(text.match(/[+-]?\d+/)?.[0]);
  }
  return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.round(value))) : fallback;
}

function normalizeTemplate(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (text === 'starcourier' || /航道|星核|运输/.test(text)) return 'star-courier';
  if (['firefly', 'fireflies'].includes(text) || /节奏|萤火虫/.test(text)) return 'fireflies';
  if (['vault', 'memory'].includes(text) || /记忆|解码|星图/.test(text)) return 'vault';
  return null;
}

function normalizePalette(value) {
  const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (palettes.includes(text)) return text;
  if (text === '极光') return 'aurora';
  if (text === '金') return 'gold';
  return 'nebula';
}

const difficultyLevels = new Map([
  ['轻松', 1], ['简单', 1], ['标准', 2], ['中等', 2], ['进阶', 3], ['困难', 3],
]);

function game(value, normalize = false) {
  if (!value) return null;
  const template = normalize ? normalizeTemplate(value.template) : value.template;
  const palette = normalize ? normalizePalette(value.palette) : value.palette;
  if (typeof template !== 'string' || !Object.hasOwn(goals, template) || !palettes.includes(palette)) return null;
  const [min, max] = goals[template];
  const level = normalize && typeof value.difficulty === 'string'
    ? difficultyLevels.get(value.difficulty.trim()) ?? value.difficulty : value.difficulty;
  const difficulty = gameNumber(level, 1, 3, normalize ? 2 : undefined);
  const goal = gameNumber(value.goal, min, max, normalize ? defaultGoals[template] : undefined);
  if (difficulty === null || goal === null) return null;
  const fields = {
    title: clean(value.title, 16, normalize), pitch: clean(value.pitch, 90, normalize),
    choice: clean(value.choice, 90, normalize), reason: clean(value.reason, 90, normalize),
    nextPrompt: clean(normalize ? value.nextPrompt ?? value.next_prompt : value.nextPrompt, 90, normalize),
  };
  if (Object.values(fields).some(value => !value)) return null;
  return { ...fields, template, palette, difficulty, goal };
}

function upstreamError(code) {
  return Object.assign(new Error(code), { code });
}

function stripThoughtTags(text) {
  const stack = [];
  let out = '';
  for (let i = 0; i < text.length; ) {
    if (stack.length === 0 && text[i] === '"') {
      let end = i + 1;
      while (end < text.length) {
        if (text[end] === '\\') end += 2;
        else if (text[end] === '"') { end++; break; }
        else end++;
      }
      out += text.slice(i, end);
      i = end;
      continue;
    }
    if (text[i] === '<') {
      const head = text.slice(i, i + 128);
      const open = head.match(/^<(think|thought)\b[^>]*>/i);
      if (open) {
        stack.push(open[1].toLowerCase());
        i += open[0].length;
        continue;
      }
      const close = head.match(/^<\/(think|thought)\s*>/i);
      if (close) {
        const pos = stack.lastIndexOf(close[1].toLowerCase());
        if (pos !== -1) stack.length = pos;
        i += close[0].length;
        continue;
      }
    }
    if (stack.length === 0) out += text[i];
    i++;
  }
  return { source: out, openThought: stack.length > 0 };
}

function parseContent(text) {
  if (typeof text !== 'string' || !text.trim()) throw upstreamError('upstream_empty');
  if (text.length > 65536) throw upstreamError('upstream_json');
  // Match strings before tags so text inside a JSON field still reaches clean().
  const { source: stripped, openThought } = stripThoughtTags(text);
  const source = stripped.replace(/^[ \t]*`{3}(?:json)?[ \t]*\r?$/gim, '');
  let start = -1;
  let depth = 0;
  let quoted = false;
  let fallback;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (depth === 0) {
      if (char === '{') {
        start = index;
        depth = 1;
      }
      continue;
    }
    if (quoted && char === '\\') index++;
    else if (char === '"') quoted = !quoted;
    else if (!quoted && char === '{') depth++;
    else if (!quoted && char === '}' && --depth === 0) {
      let value;
      try {
        value = JSON.parse(source.slice(start, index + 1));
      } catch {
        continue;
      }
      if (Object.hasOwn(value, 'rewrite') || (Object.hasOwn(value, 'title') && Object.hasOwn(value, 'template'))) return value;
      fallback ??= value;
    }
  }
  if (fallback) return fallback;
  throw upstreamError(openThought || !source.trim() ? 'upstream_empty' : 'upstream_json');
}

const failures = {
  upstream_auth: [502, 'AI 密钥鉴权未通过，请检查 Vercel 后台的 AI_API_KEY 配置。'],
  upstream_model: [502, 'AI 接口地址或模型未匹配，请检查 Vercel 后台的 AI_API_BASE 与 AI_MODEL 配置。'],
  upstream_rate_limit: [503, 'AI 上游暂时繁忙，请稍后再试或打开示例。'],
  upstream_timeout: [504, 'AI 生成超时，请稍后再试或打开示例。'],
  upstream_http: [502, 'AI 服务暂时不可用，请稍后重试或打开示例。'],
  upstream_empty: [502, 'AI 没有返回可玩的方案，请稍后重试或打开示例。'],
  upstream_json: [502, 'AI 返回的方案不完整，请稍后重试或打开示例。'],
  upstream_schema: [502, 'AI 返回的玩法配置无法使用，请稍后重试或打开示例。'],
};

function providerCode(status, error) {
  if ([401, 403].includes(status)) return 'upstream_auth';
  if (status === 404) return 'upstream_model';
  if (status === 429) return 'upstream_rate_limit';
  if (status === 408 || status === 504) return 'upstream_timeout';
  if ([200, 400, 422].includes(status) && error) {
    const summary = typeof error === 'string' ? error : [error?.code, error?.type, error?.message].join(' ');
    if (/invalid[_ -]?(?:api[_ -]?key|token)|api[_ -]?key|unauthori[sz]ed|authenticat|forbidden|permission[_ -]?denied/i.test(summary)) return 'upstream_auth';
    if (/model[_ -]?not[_ -]?(?:found|exist|available)|(?:unknown|invalid|unsupported)\s+model|\bmodel\b[^\r\n]{0,120}(?:not found|does not exist|not supported|not available|unavailable)|模型[^\r\n]{0,40}(?:不存在|未找到|不可用)/i.test(summary)) return 'upstream_model';
  }
  return 'upstream_http';
}

function logFailure(stage, config, errorCode, details = {}, snippet = '') {
  // Snippets are fixed descriptions, never provider or user text.
  const { httpStatus, finishReason, contentLen, reasoningLen } = details;
  const secrets = [config?.key, envValue('BIRTHDAY_REDIS_TOKEN'), envValue('BIRTHDAY_SESSION_SECRET')].filter(Boolean);
  const redact = value => {
    if (!value) return undefined;
    for (const secret of secrets) value = value.replaceAll(secret, '[redacted]');
    return value.replace(/Bearer\s+\S+|\b(?:sk|rk|pk)[-_][\w.-]+|\b(?:\d{1,3}\.){3}\d{1,3}\b/gi, '[redacted]').slice(0, 160);
  };
  console.error('[wish-ai]', JSON.stringify({
    stage, model: redact(config?.model), host: redact(config?.host),
    httpStatus, finishReason, contentLen, reasoningLen, errorCode, snippet: redact(snippet),
  }));
}

async function readBody(response, limit, truncate = false) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return text + decoder.decode();
      text += decoder.decode(value, { stream: true });
      if (truncate && text.length >= limit) return text.slice(0, limit);
      if (text.length > limit) throw upstreamError('upstream_json');
    }
  } finally {
    void reader.cancel().catch(() => {});
  }
}

function textParts(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.filter(part => ['text', 'output_text'].includes(part?.type) && typeof part.text === 'string')
    .map(part => part.text).join('');
}

function providerOutput(data) {
  const choice = data?.choices?.[0];
  const message = choice?.message ?? choice?.delta;
  const responsesText = Array.isArray(data?.output)
    ? data.output.filter(item => item?.type === 'message').map(item => textParts(item.content)).join('') : '';
  const buffered = typeof data?.output_text === 'string' ? data.output_text : responsesText;
  const reasoningBlocks = Array.isArray(message?.content) ? message.content
    .filter(part => /^(?:thinking|reasoning)$/.test(part?.type))
    .map(part => part.thinking ?? part.reasoning ?? part.text).filter(part => typeof part === 'string').join('') : '';
  const separateReasoning = message?.reasoning_content ?? message?.reasoning;
  return {
    content: textParts(message?.content) || buffered,
    reasoningLen: reasoningBlocks.length + (typeof separateReasoning === 'string' ? separateReasoning.length : 0),
    finishReason: choice?.finish_reason ?? (data?.incomplete_details?.reason === 'max_output_tokens' ? 'length' : undefined),
    ...(data?.error != null ? { error: data.error } : {}),
  };
}

function responseOutput(text, isStream) {
  if (!text.trim()) return { content: '', reasoningLen: 0 };
  if (!isStream) return providerOutput(JSON.parse(text));
  const output = { content: '', reasoningLen: 0 };
  for (const frame of text.replace(/\r\n?/g, '\n').split('\n\n')) {
    const payload = frame.split('\n').filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trimStart()).join('\n').trim();
    if (!payload) continue;
    if (payload === '[DONE]') break;
    const event = JSON.parse(payload);
    const part = providerOutput(event?.response ?? event);
    if (Object.hasOwn(part, 'error')) return part;
    if (event?.type === 'response.output_text.delta' && typeof event.delta === 'string') output.content += event.delta;
    else if (event?.response) output.content ||= part.content;
    else output.content += part.content;
    output.reasoningLen += part.reasoningLen;
    output.finishReason = part.finishReason ?? output.finishReason;
  }
  return output;
}

function compatiblePayload(base, summary) {
  const payload = { ...base, temperature: 0.7, max_tokens: 4096 };
  const parameters = [];
  if (/\bmax_completion_tokens\b/i.test(summary)) {
    delete payload.max_tokens;
    payload.max_completion_tokens = 4096;
    parameters.push('max_completion_tokens');
  } else if (/\bmax_tokens\b/i.test(summary) &&
      /support|unrecogniz|unknown|(?:not|isn.t)\s+(?:allowed|accept|permitted|recogniz)|invalid|maximum|exceed|limit|too (?:large|high)|at most|must be|上限|超限|不支持/i.test(summary)) {
    delete payload.max_tokens;
    parameters.push('max_tokens');
  }
  if (/\btemperature\b/i.test(summary)) {
    delete payload.temperature;
    parameters.push('temperature');
  }
  return { payload, snippet: parameters.join(', ') || 'retry without response_format and reasoning_effort' };
}

async function requestPrototype(config, idea, original) {
  const base = {
    model: config.model,
    messages: [
      { role: 'system', content: outputRules },
      { role: 'user', content: JSON.stringify({ request: idea, previousPrototype: original }) },
    ],
  };
  let payload = { ...base, max_tokens: 4096, temperature: 0.7, reasoning_effort: 'low',
    response_format: { type: 'json_object' } };
  const signal = AbortSignal.timeout(25000);
  let lengthRetried = false;
  for (let attempt = 1; ; attempt++) {
    const stage = 'attempt_' + attempt;
    const details = {};
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST', redirect: 'error', signal,
        headers: { Authorization: 'Bearer ' + config.key, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      details.httpStatus = response.status;
      if (!response.ok) {
        if (attempt === 1 && [400, 422, 500].includes(response.status)) {
          const summary = await readBody(response, 400, true);
          const next = compatiblePayload(base, summary);
          logFailure(stage, config, 'upstream_http', details, next.snippet);
          payload = next.payload;
          continue;
        }
        if (attempt === 2 && [400, 422].includes(response.status) &&
            ['max_tokens', 'max_completion_tokens', 'temperature'].some(key => Object.hasOwn(payload, key))) {
          await response.body?.cancel();
          logFailure(stage, config, 'upstream_http', details, 'retry with model and messages');
          payload = base;
          continue;
        }
        const summary = [400, 422].includes(response.status)
          ? await readBody(response, 400, true)
          : (await response.body?.cancel(), '');
        throw upstreamError(providerCode(response.status, summary));
      }
      const text = await readBody(response, 1048576);
      const streamed = response.headers.get('content-type')?.toLowerCase().includes('text/event-stream');
      const output = responseOutput(text, streamed);
      const { finishReason } = output;
      const normalizedFinish = typeof finishReason === 'string' ? finishReason.toLowerCase() : undefined;
      const truncated = ['length', 'max_tokens'].includes(normalizedFinish);
      details.finishReason = ['stop', 'length', 'max_tokens', 'content_filter', 'tool_calls', 'function_call', 'eos', 'end_turn']
        .includes(normalizedFinish) ? normalizedFinish : finishReason == null ? undefined : 'other';
      details.contentLen = output.content.length;
      details.reasoningLen = output.reasoningLen;
      if (Object.hasOwn(output, 'error')) throw upstreamError(providerCode(response.status, output.error));
      let value;
      try {
        value = parseContent(output.content);
      } catch (error) {
        if (lengthRetried || !truncated) throw error;
        lengthRetried = true;
        logFailure(stage, config, error.code, details, 'retry after length truncation');
        payload = Object.hasOwn(payload, 'temperature') ? { ...base, temperature: 0.7 } : base;
        continue;
      }
      if (value.rewrite === true) return { rewrite: true };
      const result = game(value, true);
      if (!result) throw upstreamError('upstream_schema');
      return result;
    } catch (error) {
      const code = signal.aborted || error.name === 'TimeoutError' ? 'upstream_timeout'
        : error instanceof SyntaxError ? 'upstream_json'
        : Object.hasOwn(failures, error.code) ? error.code : 'upstream_http';
      logFailure(stage, config, code, details, 'provider request failed');
      throw upstreamError(code);
    }
  }
}

async function generate(fields, visitor) {
  const idea = clean(fields?.idea, 240);
  const original = fields?.original == null ? null : game(fields.original);
  if (!idea) return [400, { message: '请输入一句简短的点子或修改要求。' }];
  const config = resolveConfig();
  if (!config) return [503, { code: 'unconfigured', message: '许愿 AI 接口参数尚未配置，请在 Vercel 后台设置 AI_API_BASE 与 AI_API_KEY。' }];

  const context = quotaContext(visitor);
  const { limit, windows } = context;
  let used;
  try {
    used = await reserve(context);
  } catch {
    try {
      await release(context);
    } catch {
      logFailure('quota_release', config, 'quota_unavailable');
    }
    logFailure('quota_reserve', config, 'quota_unavailable');
    return [503, { code: 'quota_unavailable', message: '配额服务暂时不可用，请稍后再试或打开示例。' }];
  }
  if (used < 0) {
    const quota = used === -windows.length ? quotaStatus(limit, limit) : await readQuotaStatus(context);
    if (quota.remaining === 0) return [429, {
      code: 'ip_quota',
      message: '当前网络最多可生成 ' + limit + ' 次 AI 许愿，次数已用完。可以继续试玩已生成的原型或现成游戏。',
      quota: quotaStatus(limit, limit),
    }];
    return [429, { code: 'quota', message: '这段时间的生成次数用完了，可以稍后再试或试玩现有作品。', quota }];
  }
  try {
    const output = await requestPrototype(config, idea, original);
    memoryReservations.delete(context.resKey);
    const latest = await readQuotaStatus(context);
    const quota = latest.used === null ? quotaStatus(limit, used) : latest;
    if (output.rewrite) return [422, { message: '换个适合大家试玩的点子吧，比如做一关太空运输。', quota }];
    return [200, { ...output, quota }];
  } catch (error) {
    try {
      await release(context);
    } catch {
      logFailure('quota_release', config, 'quota_unavailable');
    }
    const code = error.code || 'upstream_http';
    const [status, message] = failures[code];
    return [status, { code, message }];
  }
}

module.exports = { generate, getQuotaStatus, isConfigured, resolveEndpoint };
