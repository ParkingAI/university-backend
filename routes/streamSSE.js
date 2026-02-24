import express from "express";
import { param, validationResult } from "express-validator";
import prisma from "../prisma.js";
import pg from "pg";

const streamSSERouter = express.Router();

streamSSERouter.get(
  "/:streamId",

  [param("streamId").isInt({ min: 1 }).toInt()],

  async (req, res) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(400).json({ message: result.array() });
    }

    const { streamId } = req.params;

    let cityId;
    try {
      const stream = await prisma.stream.findUnique({
        where: { id: streamId },
        include: {
          parking: {
            include: { parkingZone: true },
          },
        },
      });
      if (!stream) {
        return res.status(404).json({ message: "Stream Not Found" });
      }
      cityId = stream.parking.parkingZone.cityId;
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ message: "Server Error" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const heartbeats = setInterval(() => {
      res.write(": ping\n\n");
    }, 10000);

    const pgClient = new pg.Client({ connectionString: process.env.DATABASE_URL });

    try {
      await pgClient.connect();
      await pgClient.query(`LISTEN "${cityId}"`);
    } catch (err) {
      return res.end();
    }

    pgClient.on("notification", async () => {
      try {
        const stream = await prisma.stream.findUnique({
          where: { id: streamId },
          select: {
            id: true,
            name: true,
            status: true,
            lastFrameUrl: true,
            updated_at: true,
          },
        });
        res.write(`data: ${JSON.stringify(stream)}\n\n`);
      } catch (err) {}
    });

    pgClient.on("error", () => {
      res.end();
    });

    req.on("close", async () => {
      try {
        await pgClient.end();
        clearInterval(heartbeats);
      } catch (_) {}
    });
  },
);

export default streamSSERouter;
