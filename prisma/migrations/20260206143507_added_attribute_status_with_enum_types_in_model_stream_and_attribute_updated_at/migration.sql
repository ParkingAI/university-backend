/*
  Warnings:

  - Added the required column `updated_at` to the `Stream` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StreamStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PAUSED', 'ERROR');

-- AlterTable
ALTER TABLE "Stream" ADD COLUMN     "status" "StreamStatus" NOT NULL DEFAULT 'INACTIVE',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
