-- AlterTable
ALTER TABLE "City" ADD COLUMN     "coordinates" DOUBLE PRECISION[];

-- AlterTable
ALTER TABLE "Parking_lot" ALTER COLUMN "status" SET DEFAULT false;
