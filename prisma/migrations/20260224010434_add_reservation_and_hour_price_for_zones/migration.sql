-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- AlterTable
ALTER TABLE "ParkingZone" ADD COLUMN     "hour_price" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" SERIAL NOT NULL,
    "parking_lot_id" INTEGER NOT NULL,
    "reservation_from" TIMESTAMP(3) NOT NULL,
    "reservation_until" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_parking_lot_id_fkey" FOREIGN KEY ("parking_lot_id") REFERENCES "Parking_lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
