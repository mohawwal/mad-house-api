-- AlterTable
ALTER TABLE "public"."superUser" ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "refreshTokenExpiry" TIMESTAMP(3);
