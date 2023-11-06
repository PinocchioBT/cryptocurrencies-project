import { Router } from "express";
import { pool } from "../utils/db.js";
import bcrypt from "bcrypt";

const authRouter = Router();

//this create a new user ** Login Left (use JWT)
authRouter.post("/register", async (req, res) => {
    console.log("request body", req.body);
  
    try {
        const { username, email, password,role } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const client = await pool.connect();

        try {
            const queryText = `
                INSERT INTO users (username, email, password, role)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const values = [username, email, hash, role];

            const result = await client.query(queryText, values);

            console.log("User data:", result.rows[0]);

            res.json({
                message: "User registered successfully",
                data: result.rows[0]
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error registering user", error);
        return res.status(500).json({ error: "Server error" });
    }
})

export default authRouter