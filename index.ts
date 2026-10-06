import express from 'express';
import authRoutes from './src/routes/auth.route.js';
import { env } from './src/config/env.js';

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);

app.listen(env.PORT, () => {
  console.log(`Auth server listening on port ${env.PORT}`);
});
