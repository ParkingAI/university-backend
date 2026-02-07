import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createChannelConnection } from "./config/mqtt.js";
import authRouter from "./routes/authRouter.js";
import streamRouter from "./routes/streamRouter.js";
import parkingLotRouter from "./routes/parkingLotRouter.js";
const app = express();
export const channel = await createChannelConnection();
app.use(express.json());
app.use(cors());
app.use(morgan("common"));

app.use("/auth", authRouter);
app.use("/stream", streamRouter);
app.use("/parking-lot", parkingLotRouter);

app.listen(4000, (err) => {
  if (err) console.log(err);
  console.log("Server running on port 4000");
});
