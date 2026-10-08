-- Baseline for an empty PostgreSQL database. Derived from prisma/schema.prisma.
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "UserRole" AS ENUM ('AGENT', 'ADMIN', 'USER');

CREATE TABLE "users" (
  "id" SERIAL NOT NULL,
  "fullname" VARCHAR(200) NOT NULL,
  "email" VARCHAR(200) NOT NULL,
  "password" VARCHAR(200) NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'AGENT',
  "reset_token" TEXT,
  "token_expiry" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contact" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "email" VARCHAR(200) NOT NULL,
  "subject" VARCHAR(200) NOT NULL,
  "message" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_reset_token_key" ON "users"("reset_token");
