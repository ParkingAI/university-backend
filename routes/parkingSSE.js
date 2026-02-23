import express from "express";
import { param, validationResult } from "express-validator";
import prisma from "../prisma.js";
import pg from "pg";

const parkingSSERouter = express.Router();


parkingSSERouter.get(
  "/:cityId",

  [param("cityId").isInt({ min: 1 }).toInt()],

  async (req, res) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(400).json({ message: result.array() });
    }

    const { cityId } = req.params;

    try {
      const cityExists = await prisma.city.findUnique({ where: { id: cityId } });
      if (!cityExists) {
        return res.status(404).json({ message: "City Not Found" });
      }
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

    pgClient.on("notification", async (message) => {
      try {
    
        res.write(`data: ${JSON.stringify(message.payload)}\n\n`);
      } catch (err) {
      }
    });

    pgClient.on("error", (err) => {
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

export default parkingSSERouter;
