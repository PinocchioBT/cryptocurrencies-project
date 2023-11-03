import { Router } from "express";
import { pool } from "../utils/db.js";
import BigNumber from "bignumber.js";

const customerRouter = Router();

customerRouter.post("/buyCryptocurrency", async (req, res) => {
    try {
      console.log("request body", req.body);
      const { user_id, currency_id, amount } = req.body;
  
      // Validate the input
      if (!user_id || !currency_id || !amount) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
  
      // Check if the user exists
      const userQuery = "SELECT * FROM users WHERE user_id = $1";
      const userResult = await pool.query(userQuery, [user_id]);
  
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // Check if the currency exists
      const currencyQuery = "SELECT * FROM cryptocurrencies WHERE currency_id = $1";
      const currencyResult = await pool.query(currencyQuery, [currency_id]);
  
      if (currencyResult.rows.length === 0) {
        return res.status(404).json({ error: "Currency not found" });
      }
  
      // Get the user's wallet for the specified currency
      const walletQuery = "SELECT * FROM wallet WHERE user_id = $1 AND currency_id = $2";
      const walletResult = await pool.query(walletQuery, [user_id, currency_id]);
  
      let walletData;
  
      if (walletResult.rows.length === 0) {
        // If wallet doesn't exist, create a new one
        const createWalletQuery = "INSERT INTO wallet (user_id, currency_id, balance) VALUES ($1, $2, $3) RETURNING *";
        const createWalletResult = await pool.query(createWalletQuery, [user_id, currency_id, 0]);
  
        walletData = createWalletResult.rows[0];
      } else {
        walletData = walletResult.rows[0];
      }
  
      const currentBalance = walletData.balance;
  
      // Validate if the user has sufficient balance
      if (currentBalance < amount) {
        return res.status(400).json({ error: "Insufficient balance for purchase" });
      }
  
      // Calculate new balance after purchase
      const updatedBalance = currentBalance - amount;
  
      // Update the user's wallet balance
      const updateWalletQuery = "UPDATE wallet SET balance = $1 WHERE user_id = $2 AND currency_id = $3";
      await pool.query(updateWalletQuery, [updatedBalance, user_id, currency_id]);
  
      // Record the transaction (You may need to adjust this part based on your specific transaction recording process)
  
      res.json({ message: "Cryptocurrency bought successfully" });
    } catch (error) {
      console.error("Internal server error", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  customerRouter.post("/sellCryptocurrency", async (req, res) => {
    try {
      console.log("request body", req.body);
      const { userId, currencyId, amount } = req.body;
  
      // Validate the input
      if (!userId || !currencyId || !amount) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
  
      // Check if the user exists
      const userQuery = "SELECT * FROM users WHERE user_id = $1";
      const userResult = await pool.query(userQuery, [userId]);
  
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // Check if the currency exists
      const currencyQuery =
        "SELECT * FROM cryptocurrencies WHERE currency_id = $1";
      const currencyResult = await pool.query(currencyQuery, [currencyId]);
  
      if (currencyResult.rows.length === 0) {
        return res.status(404).json({ error: "Currency not found" });
      }
  
      // Get the user's wallet balance for the specified currency
      const walletQuery =
        "SELECT * FROM wallet WHERE user_id = $1 AND currency_id = $2";
      const walletResult = await pool.query(walletQuery, [userId, currencyId]);
  
      if (walletResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Wallet not found for user and currency" });
      }
  
      const walletData = walletResult.rows[0];
      const currentBalance = new BigNumber(walletData.balance);
      const sellAmount = new BigNumber(amount);
  
      // Calculate new balance after sale
      const updatedBalance = currentBalance.plus(sellAmount);
  
      // Update the user's wallet balance
      const updateWalletQuery =
        "UPDATE wallet SET balance = $1 WHERE user_id = $2 AND currency_id = $3";
      await pool.query(updateWalletQuery, [updatedBalance.toString(), userId, currencyId]);
  
      // Record the transaction (You may need to adjust this part based on your specific transaction recording process)
  
      res.json({ message: "Cryptocurrency sold successfully" });
    } catch (error) {
      console.error("Internal server error", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

customerRouter.post("/transferCryptocurrency", async (req, res) => {
  try {
    const { senderUserId, receiverUserId, fromCurrency, toCurrency, amount } =
      req.body;

    // Get sender's wallet data for the source currency
    const senderWalletQuery = `
            SELECT balance
            FROM wallet
            WHERE user_id = $1 AND currency_id = $2
        `;

    const senderWalletResult = await pool.query(senderWalletQuery, [
      senderUserId,
      fromCurrency,
    ]);

    const senderWalletData = senderWalletResult.rows[0];

    const senderBalance = senderWalletData?.balance || 0;

    if (senderBalance < amount) {
      return res
        .status(400)
        .json({ error: "Insufficient balance for transfer" });
    }

    let targetAmount = amount;

    if (fromCurrency !== toCurrency) {
      // Fetch the exchange rate
      const exchangeRateQuery = `
                SELECT exchange_rate
                FROM exchange_rates
                WHERE from_currency_id = $1 AND to_currency_id = $2
            `;

      const exchangeRateResult = await pool.query(exchangeRateQuery, [
        fromCurrency,
        toCurrency,
      ]);
      const exchangeRateData = exchangeRateResult.rows[0];

      const exchangeRate = exchangeRateData?.exchange_rate;

      if (!exchangeRate) {
        return res.status(400).json({ error: "Exchange rate not found" });
      }

      // Calculate the target amount using the exchange rate
      targetAmount = amount * exchangeRate;
    }

    // Begin a transaction
    await pool.query("BEGIN");

    try {
      // Update sender's balance for source currency
      const updatedSenderBalance = senderBalance - amount;
      const updateSenderQuery = `
                UPDATE wallet
                SET balance = $1
                WHERE user_id = $2 AND currency_id = $3
            `;

      await pool.query(updateSenderQuery, [
        updatedSenderBalance,
        senderUserId,
        fromCurrency,
      ]);

      // Get receiver's wallet data for the target currency
      const receiverWalletQuery = `
                SELECT balance
                FROM wallet
                WHERE user_id = $1 AND currency_id = $2
            `;

      const receiverWalletResult = await pool.query(receiverWalletQuery, [
        receiverUserId,
        toCurrency,
      ]);
      const receiverWalletData = receiverWalletResult.rows[0];

      const receiverBalance = receiverWalletData?.balance || 0;

      // Update receiver's balance for target currency
      const updatedReceiverBalance = receiverBalance + targetAmount;
      const updateReceiverQuery = `
                UPDATE wallet
                SET balance = $1
                WHERE user_id = $2 AND currency_id = $3
            `;

      await pool.query(updateReceiverQuery, [
        updatedReceiverBalance,
        receiverUserId,
        toCurrency,
      ]);

      // Commit the transaction
      await pool.query("COMMIT");

      res.json({ message: "Cryptocurrency transfer successful" });
    } catch (error) {
      // Rollback the transaction in case of an error
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Internal server error", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default customerRouter;
