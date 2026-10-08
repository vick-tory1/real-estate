import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT || 3000);
const jwtSecret = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === 'production';

if (!jwtSecret) throw new Error('JWT_SECRET must be configured before starting the server.');
if (isProduction && (jwtSecret.length < 32 || jwtSecret.includes('replace-with'))) {
  throw new Error('A unique JWT_SECRET of at least 32 characters is required in production.');
}
if (isProduction && (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('postgres:postgres@localhost') || process.env.DATABASE_URL.includes('USER:PASSWORD@HOST'))) {
  throw new Error('A production DATABASE_URL must be configured before starting the server.');
}
if (isProduction && (!process.env.APP_URL || process.env.APP_URL.includes('your-domain.example'))) {
  throw new Error('APP_URL must be configured before starting the server in production.');
}
if (process.env.APP_URL) {
  try {
    const appUrl = new URL(process.env.APP_URL);
    if (!['http:', 'https:'].includes(appUrl.protocol)) throw new Error('Invalid protocol');
  } catch {
    throw new Error('APP_URL must be an absolute HTTP(S) URL.');
  }
}

app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  next();
});
app.use((req, res, next) => {
  let requestPath;
  try { requestPath = decodeURIComponent(req.path).toLowerCase(); }
  catch { return res.status(400).json({ message: 'Invalid request path.' }); }
  const blockedPaths = ['/node_modules/', '/prisma/', '/db/', '/vendor/', '/config/', '/.git/'];
  const blockedFiles = ['/server.js', '/package.json', '/package-lock.json', '/.env', '/.env.local', '/.env.example'];
  if (blockedPaths.some((prefix) => requestPath.startsWith(prefix)) || blockedFiles.includes(requestPath)) {
    return res.status(404).end();
  }
  return next();
});
app.use(express.static(__dirname));

const rateLimitBuckets = new Map();
function rateLimit({ windowMs, max, key = (req) => req.ip }) {
  return (req, res, next) => {
    const now = Date.now();
    const bucketKey = `${req.path}:${key(req)}`;
    const bucket = rateLimitBuckets.get(bucketKey);
    if (!bucket || bucket.resetAt <= now) {
      rateLimitBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count <= max) return next();
    res.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets) if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
}, 10 * 60 * 1000).unref();

function publicUser(user) {
  return { id: user.id, fullName: user.fullName, email: user.email, role: user.role };
}

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: '8h', issuer: 'samwealth-properties', audience: 'samwealth-properties-web' });
}

async function notifyContactOwner(submission) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, CONTACT_TO_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !CONTACT_TO_EMAIL) return false;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: Number(SMTP_PORT || 465) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
  });
  await transporter.sendMail({
    from: SMTP_USER,
    to: CONTACT_TO_EMAIL,
    replyTo: submission.email,
    subject: `New Contact Form Submission: ${submission.subject}`,
    text: `From: ${submission.name}\nEmail: ${submission.email}\nSubject: ${submission.subject}\n\n${submission.message}`
  });
  return true;
}

function getToken(req) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) throw new Error('Authentication required.');
  const token = authorization.slice(7).trim();
  if (!token) throw new Error('Authentication required.');
  return { token, payload: jwt.verify(token, jwtSecret, { issuer: 'samwealth-properties', audience: 'samwealth-properties-web' }) };
}

async function getAuthenticatedUser(req) {
  const { payload } = getToken(req);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime())) throw new Error('Authentication required.');
  return user;
}

function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!roles.includes(user.role)) return res.status(403).json({ message: 'You do not have access to this resource.' });
      req.user = user;
      return next();
    } catch {
      return res.status(401).json({ message: 'Authentication required.' });
    }
  };
}

async function sendPasswordResetEmail(user, resetUrl) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) throw new Error('Password reset email is not configured. Contact support.');
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: Number(SMTP_PORT || 465) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
  });
  await transporter.sendMail({
    from: SMTP_USER,
    to: user.email,
    subject: 'Reset your SamWealth Properties password',
    text: `Hello ${user.fullName},\n\nUse this link to reset your password. It expires in one hour:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`
  });
}

app.get('/api/health', async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ status: 'ok' }); }
  catch { res.status(503).json({ status: 'unavailable' }); }
});

app.post('/api/contact-submissions', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const subject = req.body.subject?.trim();
    const message = req.body.message?.trim();
    if (!name || !email || !subject || !message) return res.status(400).json({ success: false, message: 'All fields are required.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: 'Invalid email address.' });
    if ([name, email, subject].some((value) => value.length > 200) || message.length > 5000) return res.status(400).json({ success: false, message: 'Please shorten your message and try again.' });

    const submission = await prisma.contactSubmission.create({ data: { name, email, subject, message } });
    try { await notifyContactOwner(submission); } catch (error) { console.error('Contact notification failed:', error.message); }
    res.status(201).json({ success: true, message: 'Message sent successfully. An agent will get back to you on your request.' });
  } catch (error) { next(error); }
});

app.post('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }), async (req, res, next) => {
  try {
    const fullName = req.body.fullName?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const accountType = req.body.accountType;
    if (!fullName || !email || !password) return res.status(400).json({ message: 'All fields are required.' });
    if (fullName.length > 200) return res.status(400).json({ message: 'Name must be 200 characters or fewer.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (await prisma.user.findUnique({ where: { email } })) return res.status(409).json({ message: 'This email is already registered. Please log in.' });

    if (accountType !== 'USER') return res.status(400).json({ message: 'Agent accounts are created by an administrator. Please sign up as a property seeker.' });
    const user = await prisma.user.create({ data: { fullName, email, password: await bcrypt.hash(password, 12), role: 'USER' } });
    res.status(201).json({ message: 'Account created. Please log in to access your dashboard.', user: publicUser(user) });
  } catch (error) { next(error); }
});

app.post('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, key: (req) => `${req.ip}:${String(req.body?.email || '').toLowerCase()}` }), async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const accountType = req.body.accountType;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid login details.' });
    if (!['USER', 'AGENT', 'ADMIN'].includes(accountType)) return res.status(400).json({ message: 'Choose an account type.' });
    if (user.role !== accountType) return res.status(403).json({ message: `This account is registered as ${user.role.toLowerCase()}. Select the matching account type to continue.` });
    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

app.post('/api/auth/password-reset/request', rateLimit({ windowMs: 60 * 60 * 1000, max: 5, key: (req) => `${req.ip}:${String(req.body?.email || '').toLowerCase()}` }), async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      await prisma.user.update({ where: { id: user.id }, data: { resetToken: tokenHash, tokenExpiry: new Date(Date.now() + 60 * 60 * 1000) } });
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      try { await sendPasswordResetEmail(user, `${baseUrl}/resetpass.html?token=${encodeURIComponent(resetToken)}`); }
      catch (error) { console.error('Password reset email failed:', error.message); }
    }
    res.json({ message: 'If that email is registered, a password-reset link will arrive shortly.' });
  } catch (error) { next(error); }
});

app.post('/api/auth/password-reset/confirm', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) return res.status(400).json({ message: 'A valid token and an 8-character password are required.' });
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findFirst({ where: { resetToken: tokenHash, tokenExpiry: { gt: new Date() } } });
    if (!user) return res.status(400).json({ message: 'This password-reset link is invalid or expired.' });
    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(password, 12), resetToken: null, tokenExpiry: null, passwordChangedAt: new Date() } });
    res.json({ message: 'Your password has been reset. You can now log in.' });
  } catch (error) { next(error); }
});

app.get('/api/auth/me', async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    res.json({ user: publicUser(user) });
  } catch (error) { res.status(401).json({ message: 'Authentication required.' }); }
});

app.get('/api/admin/overview', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const [users, agents, contacts] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'AGENT' } }),
      prisma.contactSubmission.count()
    ]);
    res.json({ users, agents, contacts });
  } catch (error) { next(error); }
});

app.get('/api/properties', async (_req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      where: { status: 'ACTIVE' },
      include: { agent: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ properties });
  } catch (error) { next(error); }
});

app.post('/api/properties', requireRole('AGENT', 'ADMIN'), async (req, res, next) => {
  try {
    const { title, type, action, price, location, description } = req.body;
    const amount = Number(price);
    if (![title, type, action, location, description].every(value => typeof value === 'string' && value.trim()) || !Number.isFinite(amount) || amount < 0 || amount > 1e12) return res.status(400).json({ message: 'Complete every property field with a valid price.' });
    if (title.trim().length > 200 || type.trim().length > 60 || action.trim().length > 60 || location.trim().length > 200 || description.trim().length > 5000) return res.status(400).json({ message: 'One or more property fields are too long.' });
    const property = await prisma.property.create({ data: { title: title.trim(), type: type.trim(), action: action.trim(), price: amount, location: location.trim(), description: description.trim(), agentId: req.user.id } });
    res.status(201).json({ message: 'Property listing created.', property });
  } catch (error) { next(error); }
});

app.get('/api/agent/overview', requireRole('AGENT'), async (req, res, next) => {
  try {
    const properties = await prisma.property.findMany({ where: { agentId: req.user.id }, orderBy: { createdAt: 'desc' } });
    res.json({ properties });
  } catch (error) { next(error); }
});

app.get('/api/properties/mine', requireRole('AGENT', 'ADMIN'), async (req, res, next) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { agentId: req.user.id };
    const properties = await prisma.property.findMany({ where, include: { agent: { select: { fullName: true, email: true } } }, orderBy: { createdAt: 'desc' } });
    res.json({ properties });
  } catch (error) { next(error); }
});

app.patch('/api/properties/:id/status', requireRole('AGENT', 'ADMIN'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = req.body.status;
    if (!Number.isInteger(id) || !['ACTIVE', 'INACTIVE', 'SOLD', 'RENTED'].includes(status)) return res.status(400).json({ message: 'Invalid property update.' });
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return res.status(404).json({ message: 'Property not found.' });
    if (req.user.role !== 'ADMIN' && property.agentId !== req.user.id) return res.status(403).json({ message: 'You can only update your own listings.' });
    res.json({ property: await prisma.property.update({ where: { id }, data: { status } }) });
  } catch (error) { next(error); }
});

app.get('/api/admin/agents', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const agents = await prisma.user.findMany({ where: { role: 'AGENT' }, select: { id: true, fullName: true, email: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
    res.json({ agents });
  } catch (error) { next(error); }
});

app.get('/api/admin/properties', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const properties = await prisma.property.findMany({ include: { agent: { select: { fullName: true, email: true } } }, orderBy: { createdAt: 'desc' } });
    res.json({ properties });
  } catch (error) { next(error); }
});

app.post('/api/admin/agents', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const fullName = req.body.fullName?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    if (!fullName || !email || !password) return res.status(400).json({ message: 'Name, email, and a temporary password are required.' });
    if (fullName.length > 200) return res.status(400).json({ message: 'Name must be 200 characters or fewer.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid agent email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'The temporary password must be at least 8 characters.' });
    if (await prisma.user.findUnique({ where: { email } })) return res.status(409).json({ message: 'This email is already registered.' });
    const agent = await prisma.user.create({ data: { fullName, email, password: await bcrypt.hash(password, 12), role: 'AGENT' } });
    res.status(201).json({ message: 'Agent account created. Share the sign-in page and temporary password securely.', user: publicUser(agent) });
  } catch (error) { next(error); }
});

app.use('/api', (_req, res) => res.status(404).json({ message: 'API endpoint not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error.message || error);
  if (error instanceof jwt.JsonWebTokenError || error.message === 'Authentication required.') return res.status(401).json({ message: 'Authentication required.' });
  if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ message: 'Invalid JSON request body.' });
  if (error.code === 'P2002') return res.status(409).json({ message: 'That value is already in use.' });
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

const server = app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));

async function shutdown(signal) {
  console.log(`${signal} received; shutting down.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
