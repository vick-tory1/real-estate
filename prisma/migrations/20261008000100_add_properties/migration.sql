CREATE TABLE "properties" (
  "id" SERIAL NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "type" VARCHAR(60) NOT NULL,
  "action" VARCHAR(60) NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "location" VARCHAR(200) NOT NULL,
  "description" TEXT NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "agent_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "properties" ADD CONSTRAINT "properties_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
