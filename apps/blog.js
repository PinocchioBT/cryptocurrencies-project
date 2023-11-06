import { Router } from "express";
import { pool } from "../utils/db.js";

const blogRouter = Router();


customerRouter.post("/", async (req, res) => {
    try {
      console.log("request body", req.body);
      const { title, content, type, userId, currencyId } = req.body;
  
      // Validate the input
      if (!title || !content || !type || !userId || !currencyId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
  
      // Check if the user exists
      const userQuery = "SELECT * FROM users WHERE user_id = $1";
      const userResult = await pool.query(userQuery, [userId]);
  
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // Check if the currency exists
      const currencyQuery = "SELECT * FROM cryptocurrencies WHERE currency_id = $1";
      const currencyResult = await pool.query(currencyQuery, [currencyId]);
  
      if (currencyResult.rows.length === 0) {
        return res.status(404).json({ error: "Currency not found" });
      }
  
      // Create a new blog entry in the database
      const createBlogQuery = "INSERT INTO blogs (title, content, type, user_id, currency_id) VALUES ($1, $2, $3, $4, $5) RETURNING *";
      const createBlogResult = await pool.query(createBlogQuery, [title, content, type, userId, currencyId]);
  
      const newBlog = createBlogResult.rows[0];
  
      res.json({ message: 'Blog created successfully', blog: newBlog });
    } catch (error) {
      console.error("Internal server error", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

export default blogRouter