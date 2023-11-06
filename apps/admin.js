import { Router } from "express";
import { pool } from "../utils/db.js";

const adminRouter = Router();

//Admin can see all total balance of all cryptocurrency.
adminRouter.get("/totalBalance", async (req, res) => {
    try {
      // Get all currencies
      const currenciesQuery = "SELECT * FROM cryptocurrencies";
      const currenciesResult = await pool.query(currenciesQuery);
      const currencies = currenciesResult.rows;

      //Calculate all of the balances from the wallet by looping through the currencies
      let totalBalance = 0;
  
      for (const currency of currencies) {
        const walletQuery = "SELECT balance FROM wallet WHERE currency_id = $1";
        const walletResult = await pool.query(walletQuery, [currency.currency_id]);
        const walletData = walletResult.rows[0];
  
        const balance = walletData?.balance || 0;
        totalBalance += parseFloat(balance); // Ensure balance is treated as a float
      }
  
      console.log("totalBalance", totalBalance);
  
      res.json({ totalBalance });
    } catch (error) {
      console.error("Internal server error", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

// Admin can add a new wallet for a user
adminRouter.post("/addWallet", async (req, res) => {
    try {
      const { userId, currencyId, initialBalance } = req.body;
  
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
  
      // Add a new wallet for the user
      const insertQuery = `
        INSERT INTO wallet (user_id, currency_id, balance)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
  
      const values = [userId, currencyId, initialBalance || 0]; // Default initialBalance to 0 if not provided
      const { rows } = await pool.query(insertQuery, values);
      const walletData = rows[0];
  
      res.json({ message: "Wallet added successfully", walletData });
    } catch (error) {
      console.error("Internal server error", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

//Admin can add other cryptocurrency
adminRouter.post("/addCryptocurrencies", async (req, res) => {
  try {

    
    const { name, symbol } = req.body;


    const insertQuery =
      "INSERT INTO cryptocurrencies (name, symbol) VALUES ($1, $2) RETURNING *";
    const values = [name, symbol];
    const { rows } = await pool.query(insertQuery, values);

    const data = rows[0];

    return res.status(200).json({
      message: "Cryptocurrencies created successfully",
      data,
    });
  } catch (error) {
    console.error("Error posting data", error);
    return res.status(500).send("Error posting data");
  }
});

//Admin can adjust customer's balance
adminRouter.put("/adjustBalance/:walletId", async (req, res) => {
  const { walletId } = req.params;
  const { action, amount } = req.body;

  try {
    const walletQuery = "SELECT * FROM wallet WHERE walletId = $1";
    const walletResult = await pool.query(walletQuery, [walletId]);
    const walletData = walletResult.rows[0];

    const currentBalance = walletData.balance;

    let updatedBalance;
    if (action === "increase") {
      updatedBalance = currentBalance + amount;
    } else if (action === "decrease") {
      updatedBalance = currentBalance - amount;
      if (updatedBalance < 0) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    const updateQuery = "UPDATE wallet SET balance = $1 WHERE walletId = $2";
    await pool.query(updateQuery, [updatedBalance, walletId]);

    res.json({
      message: "User balance increased successfully",
      updatedBalance,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Admin can add exchange rate
adminRouter.post("/addExchangeRate", async (req, res) => {
  try {
    const { fromCurrency, toCurrency, exchangeRate } = req.body;

    const insertQuery = `
        INSERT INTO exchange_rates (from_currency_id, to_currency_id, exchange_rate)
        VALUES ($1, $2, $3)
        ON CONFLICT (from_currency_id, to_currency_id)
        DO UPDATE SET exchange_rate = $3
        RETURNING *
      `;

    const values = [fromCurrency, toCurrency, exchangeRate];
    const { rows } = await pool.query(insertQuery, values);

    return res.json({
      message: "Exchange rate added/updated successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("Internal server error", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin can update exchange rate
adminRouter.put("/updateExchangeRate", async (req, res) => {
  try {
    const { fromCurrency, toCurrency, exchangeRate } = req.body;

    const updateQuery = `
        UPDATE exchange_rates
        SET exchange_rate = $1
        WHERE from_currency_id = $2 AND to_currency_id = $3
        RETURNING *
      `;

    const values = [exchangeRate, fromCurrency, toCurrency];
    const { rows } = await pool.query(updateQuery, values);

    return res.json({
      message: "Exchange rate updated successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("Internal server error", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Admin can delete exchange rate
adminRouter.delete("/deleteExchangeRate/:exchangeRateId", async (req, res) => {
  try {
    const { exchangeRateId } = req.params;

    const deleteQuery =
      "DELETE FROM exchange_rates WHERE exchange_rates_id = $1";
    await pool.query(deleteQuery, [exchangeRateId]);

    res.json({ message: "Exchange rate deleted successfully" });
  } catch (error) {
    console.error("Internal server error", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default adminRouter;
