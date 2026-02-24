import { connect } from "amqplib";
import "dotenv/config";

let channel = null;

export const getChannel = async () => {
  if (channel) return channel;
  try {
    const connection = await connect(process.env.RABBITMQ);
    channel = await connection.createChannel();

    connection.on("error", () => {
      channel = null;
    });
    connection.on("close", () => {
      channel = null;
    });

    return channel;
  } catch (err) {
    throw err;
  }
};
