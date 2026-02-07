import express from "express";
import { body, validationResult } from "express-validator";
import prisma from "../prisma.js";
import bcrypt from "bcrypt";
import { channel } from "../index.js";
const streamRouter = express.Router();

streamRouter.post(
  "/:parkingID",
  [
    body("name").exists().isString(),
    body("coordinates").exists().isArray({ min: 2, max: 2 }),
    body("rtsp_url").exists().isString(),
    body("auth_user").exists().isString(),
    body("auth_password").exists().isString(),
    body("gst_pipeline").exists().isString(),
  ],
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ message: result.array() });
    }
    const { parkingID } = req.params;
    const queryData = {
      name: req.body.name,
      coordinates: req.body.coordinates,
      rtsp_url: req.body.rtsp_url,
      auth_user: req.body.auth_user,
      auth_password: req.body.auth_password,
      gst_pipeline: req.body.gst_pipeline,
      parkingID: Number(parkingID),
    };
    try {
      const authPasswordHashed = await bcrypt.hash(queryData.auth_password, 10);
      queryData.auth_password = authPasswordHashed;
      const referenceExists = await prisma.parking.findUnique({
        where: { id: Number(parkingID) },
      });
      if (!referenceExists) {
        return res.status(404).json({ message: "Parking Not Found" });
      }
      const stream = await prisma.stream.create({ data: queryData });
      channel.sendToQueue("rtsp.novigrad", Buffer.from(JSON.stringify(stream)));
      delete stream.auth_password;
      return res.status(201).json(stream);
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Stream creation server error" });
    }
  },
);

export default streamRouter;
