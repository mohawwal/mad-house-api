-- AlterTable
ALTER TABLE "public"."superUser" ADD COLUMN     "otp" VARCHAR(6),
ADD COLUMN     "otpExpiry" TIMESTAMP(3);
