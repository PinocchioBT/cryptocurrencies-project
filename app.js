import express from "express";
import { pool } from "./utils/db.js";
import authRouter from "./apps/auth.js";
import adminRouter from "./apps/admin.js";
import customerRouter from "./apps/customer.js";
import cors from "cors";
import bodyParser from "body-parser";


const app = express();
const port = 4001;

app.use(cors());
app.use(bodyParser.json());

app.use("/auth", authRouter)
app.use("/admin", adminRouter)
app.use("/customer", customerRouter)

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
