/*
  Warnings:

  - You are about to alter the column `hour_price` on the `ParkingZone` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `Reservation` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "ParkingZone" ALTER COLUMN "hour_price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Reservation" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);
