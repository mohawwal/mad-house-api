/*
  Warnings:

  - You are about to drop the column `eventDate` on the `events` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."events_eventDate_idx";

-- AlterTable
ALTER TABLE "public"."events" DROP COLUMN "eventDate",
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "events_startDate_idx" ON "public"."events"("startDate");

-- CreateIndex
CREATE INDEX "events_endDate_idx" ON "public"."events"("endDate");
