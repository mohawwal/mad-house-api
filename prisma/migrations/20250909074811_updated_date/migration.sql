/*
  Warnings:

  - Made the column `startDate` on table `events` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."events" ALTER COLUMN "startDate" SET NOT NULL;
