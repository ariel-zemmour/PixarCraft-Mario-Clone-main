import express from 'express';
import path from 'path';
import { apiRouter } from './api';

export const app = express();
const PORT = process.env.PORT || 3201;

app.use('/api', apiRouter);

export function startStandaloneServer() {
  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });

  return app.listen(PORT, () => {
    console.log(`Standalone server running on http://localhost:${PORT}`);
  });
}

if (process.env.RUN_STANDALONE === 'true') {
  startStandaloneServer();
}
