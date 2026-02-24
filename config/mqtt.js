import { connect } from "amqplib";
import "dotenv/config";
export const createChannelConnection = async () => {
  try {
    const connection = await connect(process.env.RABBITMQ);
    const channel = await connection.createChannel();
    await channel.assertQueue("rtsp.novigrad", { durable: true }); //trenutno
    return channel;
  } catch (err) {
    console.log(err.message);
    //Loggati u Sentry
  }
};
