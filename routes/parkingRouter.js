import express from "express"
import prisma from "../prisma.js"
const parkingRouter = new express.Router()
import { body, validationResult } from 'express-validator'

const createParkingValidation = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isString().withMessage('Name must be a string'),
  
  body('address')
    .optional({ nullable: true }) 
    .isString().withMessage('Address must be a string'),
  
  body('coordinates')
    .notEmpty().withMessage('Coordinates are required')
    .isArray({ min: 2, max: 2 }).withMessage('Coordinates must be an array of 2 numbers')
    .custom((value) => {
      if (!value.every(coord => typeof coord === 'number')) {
        throw new Error('Coordinates must contain only numbers')
      }
      return true
    }),
  
  body('Capacity')
    .notEmpty().withMessage('Capacity is required')
    .isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  
  body('parkingZoneId')
    .notEmpty().withMessage('ParkingZoneId is required')
    .isInt().withMessage('ParkingZoneId must be an integer')
]


const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: "Validation error", 
      errors: errors.array() 
    })
  }
  next()
}

parkingRouter.get("/", async (req, res) => {
    try {
        const parkings = await prisma.parking.findMany()
        return res.status(200).json(parkings)

    } catch (err) {
        return res.status(500).send({ "message": err.message })
    }
})


parkingRouter.get("/:id", async (req, res) => {
    try {
        const { id } = req.params

        const parking = await prisma.parking.findUnique({
            where: { id: parseInt(id) }
        })

        if (!parking) {
            return res.status(404).json({ message: "Parking not found" })
        }

        return res.status(200).json(parking)

    } catch (err) {
        return res.status(500).json({ message: "Error fetching parking" })
    }
})

parkingRouter.post("/", createParkingValidation, validate, async (req, res) => {
    try {
        const { name, address, coordinates, Capacity, parkingZoneId } = req.body
        const parking = await prisma.parking.create({
            data: { name, address, coordinates, Capacity, parkingZoneId }
        })
        return res.status(201).json(parking)
    } catch (err) {
        return res.status(500).send({ "message": err })
    }
})

export default parkingRouter;