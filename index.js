import express from "express"
import cors from "cors"
import morgan from "morgan"
import cookieParser from "cookie-parser";

import authRouter from "./routers/authRouter.js"
const app = express()
app.use(express.json())


app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      message: "Invalid JSON format"
    })
  }
  next(err)
})


app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(morgan("common"))

app.use("/auth", authRouter)

app.listen(4000 , (err)=>{
    if(err) console.log(err);
    console.log("Server running on port 4000")
})