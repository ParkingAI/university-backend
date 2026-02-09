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
parkingLotRouter.patch('/status/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { free, occupied } = req.body;

    const stream = await prisma.stream.findUnique({
      where: { id: parseInt(streamId) }
    });

    if (!stream) {
      return res.status(404).json({
        error: 'Stream not found',
      });
    }

    const updateFree = prisma.parking_lot.updateMany({
      where: {
        id: { in: free },
        streamId: parseInt(streamId)
      },
      data: {
        status: true 
      }
    });

    const updateOccupied = prisma.parking_lot.updateMany({
      where: {
        id: { in: occupied },
        streamId: parseInt(streamId)
      },
      data: {
        status: false  
      }
    });

    const [freeResult, occupiedResult] = await prisma.$transaction([
      updateFree,
      updateOccupied
    ]);

    res.json({
      message: 'Parking lot status updated successfully',
      streamId: parseInt(streamId),
      updated: {
        free: freeResult.count,
        occupied: occupiedResult.count,
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default parkingLotRouter;
