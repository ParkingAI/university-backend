import express from "express"
import prisma from "../prisma.js"
import bcrypt from "bcrypt"
const authRouter = new express.Router()


authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password, rola, modul, cityId } = req.body

    if (!email || !password || !rola || !cityId) {
      return res.status(400).json({ message: "Missing data" })
    }

    const exists = await prisma.users.findUnique({ where: { email } })
    if (exists) return res.status(409).json({ message: "User alredy exists" })

    const city = await prisma.city.findUnique({ where: { id: cityId } })

    if (!city) return res.status(400).json({ message: "wrong cityId" })

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.users.create({
      data: { email, password: hashed, rola, modul, cityId }
    })

    res.status(201).json({ id: user.id, email: user.email })

  } catch (e) {
    console.log(e)
    return res.status(500).json({ message: "Error while creating user" })
  }
})

export default authRouter;