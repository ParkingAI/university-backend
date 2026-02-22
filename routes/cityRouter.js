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
    return res.status(500).json({ message: "Get cities server error" });
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
      const referenceExists = await prisma.city.findUnique({
        where: { id: id },
      });
      if (!referenceExists) {
        return res.status(404).json({ message: "City Not Found" });
      }
      const [city, cityZones, cityParkings] = await Promise.all([
        prisma.city.findUnique({
          where: { id: id },
        }),
        prisma.parkingZone.count({
          where: { cityId: id },
        }),
        prisma.parking.count({
          where: {
            parkingZone: {
              cityId: id,
            },
          },
        }),
      ]);
      const cityResponseData = {
        ...city,
        metadata: {
          totalZones: cityZones,
          totalParkings: cityParkings,
        },
      };
      return res.status(200).json(cityResponseData);
    } catch (err) {
      return res.status(500).json({ message: "Get city server error" });
    }
  },
);

export default cityRouter;
