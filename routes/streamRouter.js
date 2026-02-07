import express from "express";
import { body, oneOf, param, query, validationResult } from "express-validator";
import prisma from "../prisma.js";
import bcrypt from "bcrypt";
import { channel } from "../index.js";
const streamRouter = express.Router();

//TO DO: Use prisma erros in catch block for 404 case, instead of the current way of querying database to chech if resource exists

streamRouter.post(
  "/",
  [
    body("name").exists().isString(),
    body("coordinates").exists().isArray({ min: 2, max: 2 }),
    body("rtsp_url").exists().isString(),
    body("auth_user").exists().isString(),
    body("auth_password").exists().isString(),
    body("gst_pipeline").exists().isString(),
    body("parkingId").exists().isInt({ min: 1 }).toInt(),
  ],
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ message: result.array() });
    }
    const queryData = {
      name: req.body.name,
      coordinates: req.body.coordinates,
      rtsp_url: req.body.rtsp_url,
      auth_user: req.body.auth_user,
      auth_password: req.body.auth_password,
      gst_pipeline: req.body.gst_pipeline,
      parkingId: req.body.parkingId,
    };
    try {
      const authPasswordHashed = await bcrypt.hash(queryData.auth_password, 10);
      queryData.auth_password = authPasswordHashed;
      const referenceExists = await prisma.parking.findUnique({
        where: { id: req.body.parkingId },
      });
      if (!referenceExists) {
        return res.status(404).json({ message: "Parking Not Found" });
      }
      const stream = await prisma.stream.create({ data: queryData });
      delete stream.auth_password;
      return res.status(201).json(stream);
    } catch (error) {
      return res.status(500).json({ message: "Stream creation server error" });
    }
  },
);

streamRouter.post(
  "/:streamId/controller",
  [
    param("streamId").isInt({ min: 1 }).toInt(),
    query("action")
      .exists()
      .isString()
      .isIn(["create", "pause", "start", "restart", "read"]),
  ],
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ message: result.array() });
    }
    const { streamId } = req.params;
    const { action } = req.query;
    try {
      const streamExists = await prisma.parking.findUnique({
        where: { id: streamId },
      });
      if (!streamExists) {
        return res.status(404).json({ message: "Stream Not Found" });
      }
      let microservicePayload = { id: streamId };
      if (action === "create") {
        const streamData = await prisma.stream.findUnique({
          where: { id: streamId },
          include: {
            parkingLots: {
              select: {
                id: true,
                ROI: true,
              },
            },
          },
        });
        microservicePayload = {
          ...microservicePayload,
          gst_pipeline: streamData.gst_pipeline,
          parkingId: streamData.parkingId,
          parkingLots: streamData.parkingLots,
        };
      }
      channel.sendToQueue(
        "rtsp.novigrad",
        Buffer.from(
          JSON.stringify({ action: action, stream: microservicePayload }),
        ),
      );
      return res.status(201).json({
        message: `Control ${action} send for stream with ID ${streamId}`,
      });
    } catch (err) {
      return res
        .status(500)
        .json({ message: `Stream control ${action} server error` });
    }
  },
);

streamRouter.patch(
  "/:streamId",
  [
    param("streamId").isInt({ min: 1 }).toInt(),
    oneOf([
      body("status")
        .exists()
        .isString()
        .isIn(["ACTIVE", "INACTIVE", "PAUSED", "ERROR"]),
    ]),
  ],
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ message: result.array() });
    }
    const { streamId } = req.params;
    const { status } = req.body;
    try {
      const checkStream = await prisma.stream.findUnique({
        where: { id: streamId },
      });
      if (!checkStream) {
        return res.status(404).json({ message: "Stream Not Found" });
      }
      await prisma.stream.update({
        where: { id: streamId },
        data: { status },
      });
      return res.status(204).send();
    } catch (err) {
      console.log(err.message);
      return res.status(500).json({ message: "Stream update server error" });
    }
  },
);

export default streamRouter;
