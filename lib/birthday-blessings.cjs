const { createHmac, randomUUID } = require('node:crypto');

const maxPending = 100;
const maxPublic = 200;
const rateSeconds = 300;
const rateCount = 3;

const submitScript = `
if redis.call('LLEN', KEYS[1]) >= tonumber(ARGV[2]) then return 2 end
if tonumber(redis.call('GET', KEYS[2]) or '0') >= tonumber(ARGV[3]) then return 1 end
if redis.call('INCR', KEYS[2]) == 1 then redis.call('EXPIRE', KEYS[2], ARGV[4]) end
redis.call('LPUSH', KEYS[1], ARGV[1])
return 0
`;

const reviewScript = `
local entries = redis.call('LRANGE', KEYS[1], 0, -1)
for _, entry in ipairs(entries) do
  if cjson.decode(entry).id == ARGV[1] then
    if ARGV[2] == 'approve' then
      if redis.call('LLEN', KEYS[2]) >= tonumber(ARGV[3]) then return 2 end
      redis.call('LPUSH', KEYS[2], entry)
    end
    redis.call('LREM', KEYS[1], 1, entry)
    return 1
  end
end
return 0
`;

async function redis(endpoint, token, command) {
  const response = await fetch(endpoint, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(2500),
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw Error('Redis request failed');
  const payload = await response.json();
  if (payload.error || !Object.hasOwn(payload, 'result')) throw Error('Redis command failed');
  return payload.result;
}

function clean(value, limit) {
  if (typeof value !== 'string' || value.length > limit * 2) return null;
  const trimmed = value.trim();
  if (!trimmed || [...trimmed].length > limit || /[<>\x00-\x08\x0b-\x1f\x7f]|https?:|www\./i.test(trimmed)) return null;
  return trimmed;
}

async function handleBlessings(method, scope, fields, visitor) {
  const canReview = scope === 'moderator';
  const reviewing = method === 'POST' && !!fields && (Object.hasOwn(fields, 'id') || Object.hasOwn(fields, 'action'));
  if (method !== 'GET' && method !== 'POST') return [405, { message: '请求方式不支持。' }];
  if (reviewing && !canReview) return [403, { message: '请先验证家长身份。' }];

  const { BIRTHDAY_REDIS_URL: endpoint, BIRTHDAY_REDIS_TOKEN: token, VERCEL_ENV: environment } = process.env;
  if (!endpoint || !token) return [503, { message: '祝福留言暂时无法使用。' }];
  const prefix = '{birthday-blessings:' + (environment || 'local') + '}';
  const pendingKey = prefix + ':pending';
  const publicKey = prefix + ':public';
  const command = args => redis(endpoint, token, args);

  try {
    if (method === 'GET') {
      const list = async key => (await command(['LRANGE', key, 0, -1])).map(value => JSON.parse(value));
      const messages = await list(publicKey);
      return [200, canReview ? { messages, pending: await list(pendingKey) } : { messages }];
    }

    if (reviewing) {
      const { id, action } = fields;
      if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id) || !['approve', 'reject'].includes(action)) {
        return [400, { message: '审核请求无效。' }];
      }
      const result = await command(['EVAL', reviewScript, 2, pendingKey, publicKey, id, action, maxPublic]);
      if (result === 0) return [404, { message: '这条祝福已处理或不存在。' }];
      if (result === 2) return [409, { message: '公开祝福数量已达上限。' }];
      if (result !== 1) throw Error('Invalid review result');
      return [200, { message: action === 'approve' ? '祝福已公开。' : '祝福已退回。' }];
    }

    const name = clean(fields?.name, 24);
    const message = clean(fields?.message, 240);
    if (!name || !message || /[\r\n]/.test(name)) {
      return [400, { message: '请填写 24 字以内的昵称和 240 字以内的祝福，使用纯文本。' }];
    }
    const id = randomUUID();
    const visitorHash = createHmac('sha256', token).update(String(visitor || 'unknown')).digest('hex');
    const rateKey = prefix + ':rate:' + visitorHash;
    const result = await command(['EVAL', submitScript, 2, pendingKey, rateKey,
      JSON.stringify({ id, name, message }), maxPending, rateCount, rateSeconds]);
    if (result === 1) return [429, { message: '提交太频繁，请几分钟后再试。' }];
    if (result === 2) return [503, { message: '待审核祝福较多，请稍后再试。' }];
    if (result !== 0) throw Error('Invalid submission result');
    return [201, { message: '祝福已送达，家长审核后会公开。' }];
  } catch {
    return [503, { message: '祝福服务暂时不可用，请稍后再试。' }];
  }
}

module.exports = { handleBlessings };
