/*
  Warnings:

  - Made the column `hour_price` on table `ParkingZone` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ParkingZone" ALTER COLUMN "hour_price" SET NOT NULL;
