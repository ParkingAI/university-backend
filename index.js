import express from "express"
import cors from "cors"
import morgan from "morgan"

const app = express()
app.use(express.json())
app.use(cors())
app.use(morgan("common"))

app.get("/", (req, res)=>{
    return res.status(200).send("Hello")
})

app.listen(4000 , (err)=>{
    if(err) console.log(err);
    console.log("Server running on port 4000")
})