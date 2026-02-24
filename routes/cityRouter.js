import express from "express";
import { param, validationResult } from "express-validator";
import prisma from "../prisma.js";

const cityRouter = express.Router();

cityRouter.get("/", async (req, res) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { id: "asc" },
    });

    return res.status(200).json(cities);
  } catch (err) {
    return res.status(500).json({ message: "Get cities Server Error" });
  }
});

cityRouter.get(
  "/:id",
  [param("id").isInt({ min: 1 }).toInt()],
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ message: result.array() });
    }
    const { id } = req.params;
    try {
      const city =
        await prisma.$queryRaw`SELECT "City"."id", "City"."name", "City"."coordinates", COUNT (DISTINCT "ParkingZone"."id")::int AS "totalZones", COUNT (DISTINCT "Parking"."id")::int AS "totalParkings"
        FROM "City"
        INNER JOIN "ParkingZone" ON "City"."id" = "ParkingZone"."cityId" LEFT JOIN "Parking" ON "ParkingZone"."id" = "Parking"."parkingZoneId"
        WHERE "City"."id" = ${id}
        GROUP BY "City"."id", "City"."name", "City"."coordinates";`;
      if (city.length === 0) {
        return res.status(404).json({ message: "City Not Found" });
      }
      return res.status(200).json(city[0]);
    } catch (err) {
      return res.status(500).json({ message: "Get city Server Error" });
    }
  },
);

export default cityRouter;
