import express from "express";
import amqplib from "amqplib";
import { randomUUID } from "crypto";

const webhookRouter = express.Router();

async function sendCeleryTask(taskName, args, queueName) {
  const connection = await amqplib.connect(process.env.RABBITMQ);
  const channel = await connection.createChannel();

  await channel.assertQueue(queueName, { durable: true });

  const taskMessage = {
    task: taskName,
    args: args,
    kwargs: {},
    id: randomUUID(),
  };

  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(taskMessage)), {
    contentType: "application/json",
    contentEncoding: "utf-8",
  });

  await channel.close();
  await connection.close();
}

webhookRouter.post("/", async (req, res) => {
  try {
    const { id_stream, frameUrl, queueName } = req.body;

    await sendCeleryTask("process_frame", [id_stream, frameUrl], queueName);

    res.status(200).json({ message: "Task sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send task" });
  }
});

export default webhookRouter;
