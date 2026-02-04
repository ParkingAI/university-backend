import express from "express"
import cors from "cors"
import morgan from "morgan"
import authRouter from "./routers/authRouter.js"
const app = express()
app.use(express.json())
app.use(cors())
app.use(morgan("common"))

app.use("/auth", authRouter)

app.listen(4000 , (err)=>{
    if(err) console.log(err);
    console.log("Server running on port 4000")
})