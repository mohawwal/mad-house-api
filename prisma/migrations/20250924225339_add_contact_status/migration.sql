-- CreateEnum
CREATE TYPE "public"."ContactStatus" AS ENUM ('INACTIVE', 'ACTIVE');

-- AlterTable
ALTER TABLE "public"."contacts" ADD COLUMN     "status" "public"."ContactStatus" NOT NULL DEFAULT 'INACTIVE';

-- CreateIndex
CREATE INDEX "contacts_status_idx" ON "public"."contacts"("status");
