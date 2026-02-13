-- AlterTable
ALTER TABLE "Parking" ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "Parking_lot" ADD COLUMN     "status_images" JSONB;

-- AlterTable
ALTER TABLE "Stream" ADD COLUMN     "last_frame_url" TEXT;
