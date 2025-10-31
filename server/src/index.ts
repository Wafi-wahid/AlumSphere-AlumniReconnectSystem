import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { userRouter } from './routes/users';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = ORIGIN.split(',').map(o => o.trim());
const isDev = process.env.NODE_ENV !== 'production';

// ensure uploads dir exists
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser clients
    // In dev, allow localhost/127.0.0.1 and common LAN IPs
    if (
      isDev &&
      /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|\[::1\]):\d+$/.test(origin)
    ) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      isDev &&
      /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|\[::1\]):\d+$/.test(origin)
    ) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
// static files for uploads
app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => res.json({ ok: true, service: 'echo-alum-link', time: new Date().toISOString() }));

app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/', userRouter);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

async function bootstrapSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';
  if (!email || !password) {
    if (isDev) {
      console.warn('[bootstrap] SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set; skipping super admin bootstrap');
    }
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 10);
  if (!existing) {
    await prisma.user.create({
      data: { name, email, passwordHash, role: 'super_admin' },
    });
    console.log(`[bootstrap] Created super_admin ${email}`);
    return;
  }
  if (existing.role !== 'super_admin' || process.env.SUPER_ADMIN_RESET === '1') {
    await prisma.user.update({
      where: { email },
      data: {
        role: 'super_admin',
        ...(process.env.SUPER_ADMIN_RESET === '1' ? { passwordHash } : {}),
      },
    });
    console.log(`[bootstrap] Ensured super_admin role for ${email}${process.env.SUPER_ADMIN_RESET === '1' ? ' and reset password' : ''}`);
  }
}

(async () => {
  try {
    await bootstrapSuperAdmin();
  } catch (e) {
    console.error('[bootstrap] Super admin error', e);
  } finally {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  }
})();
