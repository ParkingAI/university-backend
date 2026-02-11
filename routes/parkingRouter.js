import express from "express";
import prisma from "../prisma.js";
const parkingRouter = new express.Router();
import { body, param, validationResult } from "express-validator";

const createParkingValidation = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),

  body("address")
    .optional({ nullable: true })
    .isString()
    .withMessage("Address must be a string"),

  body("coordinates")
    .notEmpty()
    .withMessage("Coordinates are required")
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates must be an array of 2 numbers")
    .custom((value) => {
      if (!value.every((coord) => typeof coord === "number")) {
        throw new Error("Coordinates must contain only numbers");
      }
      return true;
    }),

  body("Capacity").notEmpty().withMessage("Capacity is required"),

  body("parkingZoneId")
    .notEmpty()
    .withMessage("ParkingZoneId is required")
    .isInt()
    .withMessage("ParkingZoneId must be an integer"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation error",
      errors: errors.array(),
    });
  }
  next();
};

// parkingRouter.get("/:cityId", async (req, res) => {
//   const {cityId} = req.params
//     try {
//             const parkings = await prisma.parking.findMany({
//             where: {
//                 parkingZone: {
//                     cityId: parseInt(cityId)
//                 }
//             }
//         })
//         return res.status(200).json(parkings)

//     } catch (err) {
//         return res.status(500).send({ "message": err.message })
//     }
// })

parkingRouter.get(
  "/:cityId",
  [param("cityId").isInt({ min: 1 }).toInt()],
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ message: result.array() });
    }
    const { cityId } = req.params;
    try {
      const referenceExists = await prisma.city.findUnique({
        where: { id: cityId },
      });
      if (!referenceExists) {
        return res.status(404).json({ message: "City Not Found" });
      }
      const data =
        await prisma.$queryRaw`SELECT "Parking"."id", "Parking"."name", "Parking"."address", "Parking"."coordinates", "Parking"."Capacity", "ParkingZone"."name" AS "zone", COUNT(CASE WHEN "Parking_lot"."status" = true THEN 1 END)::int AS "free", COUNT(CASE WHEN "Parking_lot"."status" = false THEN 1 END)::int AS "occupied",   
        jsonb_agg(
          jsonb_build_object(
            'id', "Parking_lot"."id",
            'status', "Parking_lot"."status"
          )
          ORDER BY "Parking_lot"."id" ASC
        ) AS parking_lots
        FROM "Parking" INNER JOIN "ParkingZone" ON "Parking"."parkingZoneId" =  "ParkingZone"."id" INNER JOIN "Stream" ON "Parking"."id" = "Stream"."parkingId" INNER JOIN "Parking_lot" ON "Stream". "id" = "Parking_lot"."streamId"
        WHERE "ParkingZone"."cityId" = ${cityId}
        GROUP BY "Parking"."id", "Parking"."name", "Parking"."address", "Parking"."coordinates", "Parking"."Capacity", "ParkingZone"."name"
        ORDER BY "Parking"."id" ASC
        `;
      return res.status(200).json(data);
    } catch (err) {
      console.log(err.message);
      return res
        .status(500)
        .json({ message: "Get city parkings Server Error" });
    }
  },
);

parkingRouter.get("/single/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const parking = await prisma.parking.findUnique({
      where: { id: parseInt(id) },
    });

    if (!parking) {
      return res.status(404).json({ message: "Parking not found" });
    }

    return res.status(200).json(parking);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching parking" });
  }
});

parkingRouter.post("/", createParkingValidation, validate, async (req, res) => {
  try {
    const { name, address, coordinates, Capacity, parkingZoneId } = req.body;
    const parking = await prisma.parking.create({
      data: { name, address, coordinates, Capacity, parkingZoneId },
    });
    return res.status(201).json(parking);
  } catch (err) {
    return res.status(500).send({ message: err });
  }
});

export default parkingRouter;
