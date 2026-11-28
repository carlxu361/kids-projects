const { handleBlessings, checkModeratorAttempt } = require('../lib/birthday-blessings.cjs');
const { generate, isConfigured } = require('../lib/wish-ai.cjs');
const { createHmac, timingSafeEqual } = require('node:crypto');
const { readFile } = require('node:fs/promises');
const { extname, join } = require('node:path');

const root = join(__dirname, '../projects/birthday-12');
const sessionSeconds = 4 * 60 * 60;
const date = () => process.env.BIRTHDAY_DATE || '2026-11-28';
const localDate = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Hong_Kong', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const unlocked = () => /^\d{4}-\d{2}-\d{2}$/.test(date()) && localDate() >= date();
const equal = (left, right) => typeof left === 'string' && typeof right === 'string' &&
  Buffer.byteLength(left) === Buffer.byteLength(right) &&
  timingSafeEqual(Buffer.from(left), Buffer.from(right));
const now = () => Math.floor(Date.now() / 1000);

function sign(scope, expires) {
  const key = process.env.BIRTHDAY_SESSION_SECRET || process.env.BIRTHDAY_PREVIEW_KEY;
  return key && createHmac('sha256', key).update(scope + '.' + expires).digest('base64url');
}

function session(req) {
  const cookie = req.headers.cookie?.match(/(?:^|;\s*)birthday_session=([^;]+)/)?.[1];
  const [scope, expires, signature] = (cookie || '').split('.');
  return ['preview', 'family'].includes(scope) && Number(expires) > now() &&
    equal(signature, sign(scope, expires)) ? scope : null;
}

function login(res, scope) {
  const expires = now() + sessionSeconds;
  const secure = process.env.VERCEL ? '; Secure' : '';
  res.setHeader('Set-Cookie', 'birthday_session=' + scope + '.' + expires + '.' +
    sign(scope, expires) + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=' + sessionSeconds + secure);
  res.writeHead(303, { Location: '/birthday' }).end();
}

function visitorAddress(req) {
  const forwarded = req.headers['x-vercel-forwarded-for'];
  if (process.env.VERCEL && typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress;
}

function moderatorSignature(expires) {
  const key = process.env.BIRTHDAY_MODERATOR_KEY;
  if (key && [...key].length >= 8) return createHmac('sha256', key).update('moderator.' + expires).digest('base64url');
}

function moderatorScope(req) {
  const value = req.headers.cookie?.match(/(?:^|;\s*)birthday_moderator=([^;]+)/)?.[1];
  const [expires, signature] = (value || '').split('.');
  if (Number(expires) > now() && equal(signature, moderatorSignature(expires))) return 'moderator';
}

function reply(res, status, value, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(type.startsWith('application/json') ? JSON.stringify(value) : value);
}

async function sample(name) {
  return JSON.parse(await readFile(join(root, 'content', name), 'utf8'));
}

function privateContent(name, fallback) {
  return process.env[name] ? JSON.parse(process.env[name]) : fallback;
}

async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    if (req.body.length > 4096) throw Error('body');
    return JSON.parse(req.body);
  }
  let text = '';
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 4096) throw Error('body');
  }
  return JSON.parse(text);
}

async function media(req, res, name) {
  const files = privateContent('BIRTHDAY_MEDIA_JSON', {});
  const types = { '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.mp4': 'video/mp4', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };
  const type = types[extname(name)];
  const base = process.env.BIRTHDAY_MEDIA_BASE;
  const token = process.env.BIRTHDAY_MEDIA_TOKEN;
  if (!type || !base || !token || !Object.hasOwn(files, name) ||
    typeof files[name] !== 'string' || !/^[\w.-]+$/.test(files[name]) || /^\.+$/.test(files[name])) {
    return reply(res, 404, { error: 'Not found' });
  }
  const headers = { Authorization: 'Bearer ' + token, 'Accept-Encoding': 'identity' };
  if (/^bytes=\d*-\d*$/.test(req.headers.range || '')) headers.Range = req.headers.range;
  const upstream = await fetch(base.replace(/\/$/, '') + '/' + encodeURIComponent(files[name]),
    { headers, redirect: 'error', signal: AbortSignal.timeout(12000) });
  if (![200, 206, 416].includes(upstream.status)) return reply(res, 502, { error: 'Media unavailable' });
  const responseHeaders = { 'Content-Type': type };
  for (const name of ['content-length', 'content-range', 'accept-ranges']) {
    if (upstream.headers.has(name)) responseHeaders[name] = upstream.headers.get(name);
  }
  res.writeHead(upstream.status, responseHeaders);
  for await (const chunk of upstream.body) res.write(chunk);
  res.end();
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const url = new URL(req.url, 'http://localhost');
  const part = url.searchParams.get('part') || url.pathname.replace(/^\/birthday\/?/, '') || 'page';
  const scope = session(req);
  try {
    if (part === 'page' && req.method === 'GET' && url.searchParams.has('preview')) {
      if (equal(url.searchParams.get('preview'), process.env.BIRTHDAY_PREVIEW_KEY) && sign('preview', now())) return login(res, 'preview');
      return reply(res, 404, { error: 'Not found' });
    }
    if (part === 'family-session' && req.method === 'POST') {
      const fields = await body(req).catch(() => ({}));
      if (equal(fields.code, process.env.BIRTHDAY_FAMILY_KEY) && sign('family', now())) return login(res, 'family');
      return reply(res, 403, { message: '家庭口令不正确。' });
    }
    if (part === 'wish' && req.method === 'POST') {
      if (/^(1|true)$/i.test(String(process.env.WISH_REQUIRE_SESSION || '').trim()) && !scope) {
        return reply(res, 403, { message: '先到船员页输入家庭口令，再来生成。' });
      }
      const fields = await body(req).catch(() => null);
      const [status, result] = await generate(fields, visitorAddress(req));
      return reply(res, status, result);
    }
    if (part === 'blessings-session' && req.method === 'POST') {
      const { code } = await body(req).catch(() => null) || {};
      const currentSecond = now();
      const expires = currentSecond + sessionSeconds;
      const signature = moderatorSignature(expires);
      if (!signature) {
        return reply(res, 503, { message: '家长审核口令未生效。请检查此部署是否配置了至少 8 个字符的审核口令。' });
      }
      let attempt;
      try {
        attempt = await checkModeratorAttempt(visitorAddress(req),
          equal(code, process.env.BIRTHDAY_MODERATOR_KEY), currentSecond);
      } catch {
        return reply(res, 503, { message: '审核登录暂时不可用，请稍后再试。' });
      }
      if (attempt.remaining === 0) {
        res.setHeader('Retry-After', String(attempt.resetIn));
        return reply(res, 429, { message: '今天的审核口令尝试次数已用完，请在香港时间零点后再试。' });
      }
      if (attempt.remaining > 0) {
        return reply(res, 403, { message: '审核口令不正确，今天还可尝试 ' + attempt.remaining + ' 次。' });
      }
      const secure = process.env.VERCEL ? '; Secure' : '';
      res.setHeader('Set-Cookie', 'birthday_moderator=' + expires + '.' + signature +
        '; HttpOnly; SameSite=Strict; Path=/birthday; Max-Age=' + sessionSeconds + secure);
      return reply(res, 200, { message: '已开启家长审核。' });
    }
    if (part === 'blessings') {
      const fields = req.method === 'POST' ? await body(req).catch(() => null) : null;
      const [status, result] = await handleBlessings(req.method, moderatorScope(req), fields, visitorAddress(req));
      return reply(res, status, result);
    }
    if (req.method !== 'GET') return reply(res, 405, { error: 'Method not allowed' });
    if (part === 'card') {
      if (!unlocked()) return reply(res, 404, { error: 'Not found' });
      return reply(res, 200, {
        title: '橙子 12 岁生日庆祝页', date: date(),
        display: localDate() === date() ? 'banner' : 'card',
        description: '重温生日庆祝，玩游戏、听钢琴，也可以给橙子送上祝福。',
      });
    }
    if (part === 'data') {
      const copy = await sample('copy.json');
      copy.credits = { ...copy.credits, ...privateContent('BIRTHDAY_CREDITS_JSON', {}) };
      const logs = await sample('chatlog.json');
      const family = await sample('family/index.json');
      return reply(res, 200, {
        privateAccess: !!scope,
        wishAiConfigured: isConfigured(),
        copy,
        guideArt: scope ? process.env.BIRTHDAY_GUIDE_MEDIA || null : null,
        songs: scope ? privateContent('BIRTHDAY_SONGS_JSON', await sample('songs.json')) : await sample('songs.json'),
        history: await sample('history.json'),
        logs: scope ? { ...logs, ...privateContent('BIRTHDAY_CHATLOG_JSON', {}) } : logs,
        family: scope ? privateContent('BIRTHDAY_FAMILY_JSON', family) : family,
      });
    }
    if (part.startsWith('media/') && scope) return await media(req, res, part.slice(6));
    if (/^(?:machines|hachi)\/[a-z0-9-]+\.webp$/.test(part)) {
      const image = await readFile(join(root, part)).catch(() => null);
      if (!image) return reply(res, 404, { error: 'Not found' });
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=600');
      return reply(res, 200, image, 'image/webp');
    }
    const artwork = ['hero.webp', 'cake.webp', 'game-time.webp', 'weekend-hike.webp', 'food-choice.webp'];
    if (artwork.includes(part)) {
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=600');
      return reply(res, 200, await readFile(join(root, part)), 'image/webp');
    }
    // Keep browser modules as text in the function bundle so Vercel serves their original ESM.
    const files = { 'cake-3d.js': ['cake-3d.js.txt', 'text/javascript'],
      'stage-3d.js': ['stage-3d.js.txt', 'text/javascript'],
      'three-0.160.0.min.js': ['three-0.160.0.min.js.txt', 'text/javascript'],
      'blow-detector.js': ['blow-detector.js', 'text/javascript'], 'cake-geometry.js': ['cake-geometry.js', 'text/javascript'],
      'piano-library.js': ['piano-library.js', 'text/javascript'],
      'blessings.js': ['blessings.js', 'text/javascript'],
      'party-cake.js': ['party-cake.js', 'text/javascript'], 'effects.js': ['effects.js', 'text/javascript'], 'wishes.js': ['wishes.js', 'text/javascript'], 'arcade.js': ['arcade.js', 'text/javascript'], page: ['index.html', 'text/html'], 'app.js': ['app.js', 'text/javascript'],
      'style.css': ['style.css', 'text/css'] };
    if (Object.hasOwn(files, part)) {
      const [file, type] = files[part];
      if (part === 'three-0.160.0.min.js') {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (part !== 'page') {
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=600');
      }
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; frame-src 'none'; media-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
      return reply(res, 200, await readFile(join(root, file)), type + '; charset=utf-8');
    }
    return reply(res, 404, { error: 'Not found' });
  } catch {
    if (res.headersSent) return res.destroy();
    return reply(res, 500, { error: 'Mission unavailable' });
  }
};
