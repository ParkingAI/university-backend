import express from "express";
import { body, validationResult } from "express-validator";
import prisma from "../prisma.js";
const parkingLotRouter = express.Router();

parkingLotRouter.post(
  "/",
  [
    body("parkingLots").exists().isArray({ min: 1 }),
    body("parkingLots.*.ROI").isArray({ min: 4 }),
    body("parkingLots.*.ROI.*").isArray({ min: 2, max: 2 }),
    body("parkingLots.*.streamId").isInt({ min: 1 }).toInt(),
  ],
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ message: result.array() });
    }
    const { parkingLots } = req.body;
    try {
      await prisma.parking_lot.createMany({
        data: parkingLots,
      });
      res.status(204).send();
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Parking lots creation server error" });
    }
  },
);



// update parking lot status
parkingLotRouter.patch('/status', async (req, res) => {
  try {
    const { free, occupied } = req.body;
    console.log(req.body)

    const updateFree = prisma.parking_lot.updateMany({
      where: {id: { in: free }},
      data: {status: true}
    });

    const updateOccupied = prisma.parking_lot.updateMany({
      where: {id: { in: occupied }},
      data: {status: false}
    });

    const [freeResult, occupiedResult] = await prisma.$transaction([
      updateFree,
      updateOccupied
    ]);
    
   
    return res.status(204).json({
      message: 'Parking lot status updated successfully',
      updated: {
        free: freeResult.count,
        occupied: occupiedResult.count,
      }
    });

  } catch (error) {
    console.error(error);
   return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default parkingLotRouter;
