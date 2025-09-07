/*
  Warnings:

  - You are about to drop the column `refreshToken` on the `superUser` table. All the data in the column will be lost.
  - You are about to drop the column `refreshTokenExpiry` on the `superUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."superUser" DROP COLUMN "refreshToken",
DROP COLUMN "refreshTokenExpiry";
