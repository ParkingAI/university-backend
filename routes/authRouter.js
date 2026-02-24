import express from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import prisma from "../prisma.js"
import { body, validationResult } from 'express-validator'

const authRouter = new express.Router()
const COOKIE_NAME = "sp_user"

const registerValidation = [
  body('email')
    .notEmpty().withMessage('Missing email')
    .isEmail().withMessage('Email is not valid'),
  
  body('password')
    .notEmpty().withMessage('Missing password'),
  
  body('rola')
    .notEmpty().withMessage('Missing rola'),
  
  body('cityId')
    .notEmpty().withMessage('missing CityId')
    .isInt().withMessage('CityId has to be intiger'),
  
  body('modul')
    .notEmpty().withMessage('missing user modul')
]

const loginValidation = [
  body('email')
  .notEmpty().withMessage('Missing email')
  .isEmail().withMessage('Email is not valid'),
  
  body('password')
    .notEmpty().withMessage('Missing password')
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

authRouter.post("/register", registerValidation, validate, async (req, res, next) => {
  try {
    const { email, password, rola, modul, cityId } = req.body

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
    return res.status(500).json({ message: "Error while creating user" })
  }
})



authRouter.post("/login", loginValidation, validate,  async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await prisma.users.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ message: "Invalid credentials" })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ message: "Invalid credentials" })

    const token = jwt.sign(
      { sub: user.id, rola: user.rola, modul: user.modul, cityId: user.cityId },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    )

    res.cookie(COOKIE_NAME, token, {
      httpOnly: false,
      secure: false,   
      sameSite: "lax", 
      domain: process.env.DOMAIN,
      maxAge: 12 * 60 * 60 * 1000,
      path: "/",
    })

   return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        rola: user.rola,
        modul: user.modul,
        cityId: user.cityId
      },
      created: true,
    });
  } catch (e) {
    return res.status(500).send({"message": "error while logging in"})
  }
})


authRouter.patch("/password", async (req, res) => {
  const token = req?.cookies?.sp_user;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.sub;
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  const { newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({ message: "newPassword is required" });
  }

  try {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({ where: { id: userId }, data: { password: hashed } });

    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Error while changing password" });
  }
});

authRouter.post("/checkuser", async (req, res, next) => {
  const token = req?.cookies?.sp_user;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        res.json({ status: false });
        next();
      } else {
        const id = decodedToken.sub; 
        const user = await prisma.users.findUnique({ where: { id } })
        if (user) {
          res.json({
            status: true,
            user: {
              id: user.id,
              email: user.email,
              rola: user.rola,
              cityId: user.cityId,
            },
          });
        } else {
          res.json({ status: false });
        }
        next();
      }
    });
  } else {
    res.json({ status: false });
    next();
  }
});


export default authRouter;