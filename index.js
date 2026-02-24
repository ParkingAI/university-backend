import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRouter.js";
import streamRouter from "./routes/streamRouter.js";
import parkingLotRouter from "./routes/parkingLotRouter.js";
import parkingRouter from "./routes/parkingRouter.js";
import webhookRouter from "./routes/webhook.js";
import cityRouter from "./routes/cityRouter.js";
import parkingSSERouter from "./routes/parkingSSE.js";
import reservationRouter from "./routes/reservationRouter.js";
import { stripeWebhookHandler } from "./controllers/stripeWebhook.controller.js";

import streamSSERouter from "./routes/streamSSE.js";
const app = express();

app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler,
);

app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON format",
    });
  }
  next(err);
});

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(morgan("common"));

app.use("/auth", authRouter);
app.use("/stream", streamRouter);
app.use("/parking-lot", parkingLotRouter);
app.use("/parking", parkingRouter);
app.use("/webhook", webhookRouter);
app.use("/city", cityRouter);
app.use("/parking-sse", parkingSSERouter);
app.use("/reservation", reservationRouter);
app.use("/stream-sse", streamSSERouter);

app.listen(8080, (err) => {
  if (err) console.log(err);
  console.log("Server running on port 8080");
});
