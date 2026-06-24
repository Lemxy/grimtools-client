/**
 * Иллюстративный пример backend-паттерна для desktop-клиента с device-bound
 * лицензированием. Написан отдельно для портфолио — это НЕ продакшен-сервер
 * оригинального проекта (тот не публикуется намеренно). Здесь показана та же
 * архитектура (auth, device-binding, rate limiting, двухфазное списание лимита),
 * но на нейтральных сущностях "license/plan" вместо доменной логики исходного продукта.
 */
'use strict';

require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');

const PORT       = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET не задан в .env');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.disable('x-powered-by');

// CORS: нативные клиенты (Tauri/reqwest) не шлют заголовок Origin вообще — пропускаем.
// Браузерные origin'ы — только из явного allowlist в .env.
const ALLOWLIST = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin(origin, cb) {
    if (!origin || ALLOWLIST.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '1mb' }));

const authLimiter   = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use(globalLimiter);

// In-memory хранилище для примера — в реальном проекте здесь SQLite/Postgres.
const users = new Map();
const PLAN_LIMITS = { FREE: 1, PRO: 5, TEAM: 20, ENTERPRISE: Infinity };
const CYCLE_MS = 48 * 60 * 60 * 1000;

function requireAuth(req, res) {
  const token = req.body?.token || req.query?.token;
  if (!token) { res.status(401).json({ error: 'No token' }); return null; }
  try {
    const { email, deviceId } = jwt.verify(token, JWT_SECRET);
    // Токен привязан к устройству, на котором выпущен — запрос должен прийти
    // с того же deviceId. Защита от шеринга токена между разными машинами.
    const providedDevice = req.get('x-device-id') || req.body?.deviceId;
    if (deviceId && providedDevice && providedDevice !== deviceId) {
      res.status(401).json({ error: 'Device mismatch' });
      return null;
    }
    const user = users.get(email);
    if (!user) { res.status(404).json({ error: 'User not found' }); return null; }
    return user;
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
}

function refreshCycle(user) {
  if (Date.now() - user.cycleStart >= CYCLE_MS) {
    user.cycleStart = Date.now();
    user.usedThisCycle = 0;
  }
  return user;
}

app.post('/api/register', authLimiter, async (req, res) => {
  const { email, password, deviceId } = req.body;
  if (!email || !password || !deviceId) return res.status(400).json({ error: 'Missing fields' });
  if (password.length < 8) return res.status(400).json({ error: 'Password too short (min 8)' });
  if (users.has(email)) return res.status(400).json({ error: 'User exists' });

  const hashed = await bcrypt.hash(password, 10);
  users.set(email, { email, password: hashed, deviceId, plan: 'FREE', usedThisCycle: 0, cycleStart: Date.now() });

  const token = jwt.sign({ email, deviceId }, JWT_SECRET, { expiresIn: '30d', algorithm: 'HS256' });
  res.json({ token });
});

app.post('/api/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ email, deviceId: user.deviceId }, JWT_SECRET, { expiresIn: '30d', algorithm: 'HS256' });
  res.json({ token });
});

// Двухфазная активация: check-limit — превью без списания, confirm-activation — реальное
// списание, только после того как клиент подтвердил успешное выполнение нативной операции.
// Если списывать лимит прямо на check-limit, неудачная попытка на клиенте (сеть легла,
// запись на диск не удалась) всё равно сжигала бы лимит пользователя без видимого результата.
app.post('/api/check-limit', (req, res) => {
  let user = requireAuth(req, res);
  if (!user) return;
  user = refreshCycle(user);
  const limit = PLAN_LIMITS[user.plan] ?? 1;
  if (user.usedThisCycle < limit) {
    return res.json({ allowed: true, remaining: limit - user.usedThisCycle });
  }
  res.status(403).json({ allowed: false, error: 'Limit reached', resetInMs: CYCLE_MS - (Date.now() - user.cycleStart) });
});

app.post('/api/confirm-activation', (req, res) => {
  let user = requireAuth(req, res);
  if (!user) return;
  user = refreshCycle(user);
  const limit = PLAN_LIMITS[user.plan] ?? 1;
  if (user.usedThisCycle >= limit) {
    return res.status(403).json({ error: 'Limit reached' });
  }
  user.usedThisCycle += 1;
  res.json({ success: true, remaining: limit - user.usedThisCycle });
});

app.get('/api/status', (req, res) => {
  let user = requireAuth(req, res);
  if (!user) return;
  user = refreshCycle(user);
  res.json({ plan: user.plan, used: user.usedThisCycle, limit: PLAN_LIMITS[user.plan] ?? 1 });
});

app.listen(PORT, () => console.log(`[backend-example] listening on :${PORT}`));
