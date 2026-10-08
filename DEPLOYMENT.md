# Production deployment

## Configure the environment

Create a deployment-only `.env` from `.env.example`. Set the PostgreSQL connection string, a unique `JWT_SECRET`, the public HTTPS `APP_URL`, and the SMTP values. Do not commit the file. `TRUST_PROXY` must be `true` only when the app is behind a trusted reverse proxy that terminates TLS.

## Deploy

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

The application requires PostgreSQL. The old SQL files in `DB/` are MariaDB exports and are not part of the Prisma deployment path. Do not use `prisma migrate dev` in production.

Run the service behind HTTPS and monitor `GET /api/health`; it returns `200` only when the database is reachable. The built-in rate limiter protects one application instance. Use a shared gateway or rate limiter when horizontally scaling.
