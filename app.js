import express from "express";
import { pool } from "./utils/db.js";
import authRouter from "./apps/auth.js";
import cors from "cors";
import bodyParser from "body-parser";


const app = express();
const port = 4001;

app.use(cors());
app.use(bodyParser.json());

app.use("/auth", authRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
