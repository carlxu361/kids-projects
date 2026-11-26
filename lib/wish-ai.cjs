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
const outputRules = '只返回一个 JSON 对象，不要 Markdown 或代码。字段：title（游戏名，12字内），template（fireflies 节奏 / star-courier 航道 / vault 记忆，使用英文值），palette（aurora / gold / nebula），difficulty（1 到 3 整数），goal（节奏10–24次命中；航道4–14颗星核；记忆3–5轮），pitch（核心玩法一句话），choice（做了哪项设计选择），reason（这项设计如何影响玩家体验），nextPrompt（下一轮可直接发送给 AI 的具体改法）。后四项每项90字内。根据用户需求选最近的机制，如果需求超出三种机制，说明当前原型能实现的部分。面向12岁，内容健康，不索要个人信息，不输出外部链接。设计说明只给具体的选择与可观察的效果。遇到不合适的请求返回 {"rewrite":true}。';

function positiveInt(value, fallback) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : fallback;
}

async function quota() {
  const { BIRTHDAY_REDIS_URL: endpoint, BIRTHDAY_REDIS_TOKEN: token } = process.env;
  const now = Date.now();
  const parts = new Intl.DateTimeFormat('en-CA', { dateStyle: 'short', timeZone: 'Asia/Hong_Kong' }).format(new Date(now));
  const day = parts.replaceAll(/[^\d]/g, '-');
  const prefix = 'birthday-wish:' + (process.env.BIRTHDAY_DATE || '2026-11-28');
  const response = await fetch(endpoint, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(2200),
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(['EVAL', limitScript, 3, prefix + ':minute:' + Math.floor(now / 60000), prefix + ':day:' + day, prefix + ':total',
      positiveInt(process.env.AI_MINUTE_LIMIT, 3), positiveInt(process.env.AI_DAILY_LIMIT, 20),
      positiveInt(process.env.AI_TOTAL_LIMIT, 60), 120, 172800, 0]),
  });
  if (!response.ok) throw Error('quota service');
  const { result } = await response.json();
  if (result !== 0 && result !== 1) throw Error('quota response');
  return result === 1;
}

function clean(value, limit) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text && text.length <= limit && !/[<>]|https?:|www\./i.test(text) ? text : null;
}

function game(value) {
  if (!value || !Object.hasOwn(goals, value.template) || !palettes.includes(value.palette) ||
    !Number.isInteger(value.difficulty) || value.difficulty < 1 || value.difficulty > 3 ||
    !Number.isInteger(value.goal) || value.goal < goals[value.template][0] || value.goal > goals[value.template][1]) return null;
  const fields = {
    title: clean(value.title, 16), pitch: clean(value.pitch, 90),
    choice: clean(value.choice, 90), reason: clean(value.reason, 90), nextPrompt: clean(value.nextPrompt, 90),
  };
  if (Object.values(fields).some(value => !value)) return null;
  return { ...fields, template: value.template, palette: value.palette, difficulty: value.difficulty, goal: value.goal };
}

async function generate(fields) {
  const idea = clean(fields?.idea, 240);
  const original = fields?.original == null ? null : game(fields.original);
  if (!idea) return [400, { message: '请输入一句简短的点子或修改要求。' }];
  const { AI_API_BASE: base, AI_API_KEY: key, AI_MODEL: model, BIRTHDAY_REDIS_URL: redis, BIRTHDAY_REDIS_TOKEN: redisToken } = process.env;
  if (!base || !key || !model || !redis || !redisToken) {
    return [503, { message: 'AI 服务还没配置。可以打开示例，体验怎么迭代。' }];
  }
  try {
    if (!(await quota())) return [429, { message: '这段时间的生成次数用完了，可以先试玩现有作品。' }];
    const result = await fetch(base.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10500),
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model, max_tokens: 850, response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: outputRules },
          { role: 'user', content: JSON.stringify({ request: idea, previousPrototype: original }) },
        ],
      }),
    });
    if (!result.ok) throw Error('provider');
    const content = (await result.json()).choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.length > 3500) throw Error('provider output');
    const value = JSON.parse(content.trim().replace(/^\x60{3}(?:json)?\s*|\s*\x60{3}$/gi, ''));
    if (value.rewrite === true) return [422, { message: '换个适合大家试玩的点子吧，比如做一关太空运输。' }];
    const output = game(value);
    if (!output) throw Error('schema');
    return [200, output];
  } catch {
    return [503, { message: 'AI 暂时没有返回可玩的方案。可以重试，或打开示例。' }];
  }
}

module.exports = { generate };
