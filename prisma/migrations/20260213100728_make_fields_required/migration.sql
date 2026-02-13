/*
  Warnings:

  - Made the column `address` on table `Parking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `Parking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status_images` on table `Parking_lot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_frame_url` on table `Stream` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Parking" ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL;

-- AlterTable
ALTER TABLE "Parking_lot" ALTER COLUMN "status_images" SET NOT NULL;

-- AlterTable
ALTER TABLE "Stream" ALTER COLUMN "last_frame_url" SET NOT NULL;
