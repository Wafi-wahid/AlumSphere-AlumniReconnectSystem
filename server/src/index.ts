import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { userRouter } from './routes/users';
import { mentorshipRouter } from './routes/mentorship';
import recommendationsRouter from './routes/recommendations';
import { eventsRouter } from './routes/events';
import bcrypt from 'bcryptjs';
import { connectMongo } from './mongo';
import { User } from './models/User';

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = ORIGIN.split(',').map(o => o.trim());
const isDev = process.env.NODE_ENV !== 'production';

// Ensure uploads directory exists
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
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
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Static files for uploads
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => res.json({ 
  ok: true, 
  service: 'echo-alum-link', 
  time: new Date().toISOString() 
}));

// API Routes
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/', userRouter);
app.use('/', mentorshipRouter);
app.use('/recommendations', recommendationsRouter);
app.use('/api/events', eventsRouter);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error' 
  });
});

// Bootstrap super admin user
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

  try {
    const existing = await User.findOne({ email }).lean();
    if (!existing) {
      const passwordHash = await bcrypt.hash(password, 10);
      await User.create({ 
        name, 
        email, 
        passwordHash, 
        role: 'super_admin' 
      });
      console.log(`[bootstrap] Created super_admin ${email}`);
    }
  } catch (error) {
    console.error('[bootstrap] Error creating super admin:', error);
  }
}

// Start server
(async () => {
  try {
    await connectMongo();
    await bootstrapSuperAdmin();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      if (isDev) {
        console.log(`API URL: http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();