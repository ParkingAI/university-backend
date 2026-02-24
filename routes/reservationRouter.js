import express from "express";
const reservationRouter = express.Router();
import prisma from "../prisma.js";
import { body, validationResult } from "express-validator";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

reservationRouter.post(
  "/",
  [
    body("parkingLotId").exists().isInt({ min: 1 }),
    body("reservationFrom")
      .exists()
      .isISO8601()
      .custom((value, { req }) => {
        const { reservationUntil } = req.body;
        if (!reservationUntil) {
          return false;
        }
        const reservationFromToDate = new Date(value);
        const reservationUntilToDate = new Date(reservationUntil);
        const today = new Date();
        if (reservationFromToDate >= reservationUntilToDate) {
          return false;
        }
        if (reservationFromToDate.toDateString() !== today.toDateString()) {
          return false;
        }
        return true;
      }),
    body("reservationUntil")
      .exists()
      .isISO8601()
      .custom((value) => {
        const reservationUntilToDate = new Date(value);
        const today = new Date();
        if (reservationUntilToDate.toDateString() !== today.toDateString()) {
          return false;
        }
        return true;
      }),
  ],
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ message: result.array() });
    }
    const { parkingLotId, reservationFrom, reservationUntil } = req.body;
    const reservationFromToDate = new Date(reservationFrom);
    const reservationUntilToDate = new Date(reservationUntil);
    try {
      const referenceExists = await prisma.parking_lot.findUnique({
        where: { id: parkingLotId },
      });
      if (!referenceExists) {
        return res.status(404).json({ message: "Parking Lot Not Found" });
      }
      const overlappingReservation = await prisma.reservation.findFirst({
        where: {
          parkingLotId: parkingLotId,
          reservationFrom: { lte: reservationUntilToDate },
          reservationUntil: { gte: reservationFromToDate },
        },
      });
      if (overlappingReservation) {
        return res
          .status(409)
          .json({ message: "Conflict with existed reservation" });
      }
      const parkingLot = await prisma.parking_lot.findUnique({
        where: {
          id: parkingLotId,
        },
        include: {
          stream: {
            include: {
              parking: {
                include: {
                  parkingZone: {
                    select: {
                      hourPrice: true,
                      city: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const parkingLotHourPrice =
        parkingLot.stream.parking.parkingZone.hourPrice;
      const duration = reservationUntilToDate - reservationFromToDate;
      const durationHours = duration / (1000 * 60 * 60);
      const price = parseFloat(
        (durationHours * parkingLotHourPrice).toFixed(2),
      );
      const queryData = {
        parkingLotId,
        reservationFrom: reservationFromToDate,
        reservationUntil: reservationUntilToDate,
        price,
      };
      const reservation = await prisma.reservation.create({
        data: queryData,
      });

      const cityData = {
        name: parkingLot.stream.parking.parkingZone.city.name.toLowerCase(),
        id: parkingLot.stream.parking.parkingZone.city.id,
      };

      const formatDateTime = (date) => {
        return new Date(date).toLocaleString("hr-HR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `Parking rezervacija #${reservation.id}`,
                description: `Rezervacija parking mjesta sa oznakom ${reservation.parkingLotId} za vrijeme od ${formatDateTime(reservation.reservationFrom)} do ${formatDateTime(reservation.reservationUntil)}`,
              },
              unit_amount: Math.round(reservation.price * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL}/${cityData.name}/${cityData.id}/parkiralista`,
        cancel_url: `${process.env.FRONTEND_URL}/#gradovi`,
        metadata: {
          reservationId: reservation.id,
        },
      });

      res.status(201).json({ sessionUrl: session.url });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Create reservation Server Error" });
    }
  },
);

export default reservationRouter;
