import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import prisma from "../prisma.js";

export const stripeWebhookHandler = async (req, res) => {
  let event;
  const signature = req.headers["stripe-signature"];
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_SIGNING_SECRET,
    );
  } catch (err) {
    return res.sendStatus(400);
  }
  const reservationId = event.data.object?.metadata?.reservationId;
  if (!reservationId) return res.sendStatus(200);
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await prisma.reservation.update({
          where: {
            id: parseInt(reservationId),
          },
          data: {
            paymentStatus: "SUCCEEDED",
          },
        });
        break;
      case "checkout.session.expired":
        await prisma.reservation.update({
          where: {
            id: parseInt(reservationId),
          },
          data: {
            paymentStatus: "FAILED",
          },
        });
        break;
    }
  } catch (err) {
    console.log("Webhook stripe Server Error: ", {
      eventId: event.id,
      type: event.type,
      reservationId,
      message: err.message,
    });
  }
  return res.sendStatus(200);
};
