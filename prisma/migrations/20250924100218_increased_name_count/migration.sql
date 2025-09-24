/*
  Warnings:

  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "public"."contacts" ALTER COLUMN "firstname" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "lastname" SET DATA TYPE VARCHAR(100);

-- DropTable
DROP TABLE "public"."messages";
