import { Router } from "express";
import { pool } from "../utils/db.js";
import BigNumber from "bignumber.js";

const customerRouter = Router();

customerRouter.post("/buySellCryptocurrency", async (req, res) => {
  try {
    const { userId, currencyId, amount, type } = req.body;

    // Validate the request body -> check if the required parameters are present
    if (!userId || !currencyId || !amount || !type) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Check if the user exists -> if not, return an error
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

    // Get the user's wallet balance and select the currency from the wallet
    const walletQuery =
      "SELECT * FROM wallet WHERE user_id = $1 AND currency_id = $2";
    const walletResult = await pool.query(walletQuery, [userId, currencyId]);

    if (walletResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Wallet not found for user and currency" });
    }

    const walletData = walletResult.rows[0];
    const currentBalance = parseFloat(walletData.balance);
    const transactionAmount = parseFloat(amount);

    let updatedBalance = 0;

    console.log("Current Balance:", currentBalance);
    console.log("Transaction Amount:", transactionAmount);

    if (type === "buy") {
      // Calculate new balance after "buying" = -transactionAmount
      if (currentBalance < transactionAmount) {
        return res
          .status(400)
          .json({ error: "Insufficient balance for purchase" });
      }
      updatedBalance = currentBalance - transactionAmount;
    } else if (type === "sell") {
      // Calculate new balance after "selling" = +transactionAmount
      updatedBalance = currentBalance + transactionAmount;
    } else {
      return res.status(400).json({ error: "Invalid transaction type" });
    }

    // Update the user's wallet balance
    const updateWalletQuery =
      "UPDATE wallet SET balance = $1 WHERE user_id = $2 AND currency_id = $3";
    await pool.query(updateWalletQuery, [
      updatedBalance.toString(),
      userId,
      currencyId,
    ]);

    // Record the transaction
    const recordTransactionQuery = `
    INSERT INTO transactions (user_id, currency_id, amount, type)
    VALUES ($1, $2, $3, $4)
  `;
    await pool.query(recordTransactionQuery, [
      userId,
      currencyId,
      amount,
      type,
    ]);

    res.json({
      message: `Cryptocurrency ${
        type === "buy" ? "bought" : "sold"
      } successfully`,
    });
  } catch (error) {
    console.error("Internal server error", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

customerRouter.post("/transferCryptocurrency", async (req, res) => {
  try {
    const { senderUserId, receiverUserId, fromCurrency, toCurrency, amount } =
      req.body;

      //SENDER WALLET
    // Get sender's wallet data for the selected currency
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

    console.log("Sender Balance:", senderBalance);

    if (senderBalance < amount) {
      return res
        .status(400)
        .json({ error: "Insufficient balance for transfer" });
    }

    // Begin a transaction
    await pool.query("BEGIN");

    try {
      // Update sender's balance for selected currency
      const updatedSenderBalance = parseFloat(senderBalance) - parseFloat(amount);
      const updateSenderQuery = `
        UPDATE wallet
        SET balance = $1
        WHERE user_id = $2 AND currency_id = $3
      `;
      console.log("Updated Sender Balance:", updatedSenderBalance);

      await pool.query(updateSenderQuery, [
        updatedSenderBalance.toString(),
        senderUserId,
        fromCurrency,
      ]);


      // RECEIVER WALLET
      
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

      console.log("Receiver Wallet Data:", receiverWalletData);
      const receiverBalance = receiverWalletData?.balance || 0;

      // Update receiver's balance for target currency
      const updatedReceiverBalance = parseFloat(receiverBalance) + parseFloat(amount);
      const updateReceiverQuery = `
        UPDATE wallet
        SET balance = $1
        WHERE user_id = $2 AND currency_id = $3
      `;

      console.log("Updated Receiver Balance:", updatedReceiverBalance);

      await pool.query(updateReceiverQuery, [
        updatedReceiverBalance.toString(),
        receiverUserId,
        toCurrency,
      ]);

      // Commit the transaction
      await pool.query("COMMIT");

      const recordTransactionQuery = `
        INSERT INTO transactions (sender_user_id, receiver_user_id, from_currency, to_currency, amount, type)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await pool.query(recordTransactionQuery, [
        senderUserId,
        receiverUserId,
        fromCurrency,
        toCurrency,
        amount,
        "transfer",
      ]);

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

//customer can see all transactions (only their data)
customerRouter.get("/transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if the user exists
    const userQuery = "SELECT * FROM users WHERE user_id = $1";
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const transactionsQuery = `
      SELECT * FROM transactions WHERE user_id = $1
    `;
    const transactionsResult = await pool.query(transactionsQuery, [userId]);
    const transactions = transactionsResult.rows;
    res.json({ transactions });
  } catch (error) {
    console.error("Internal server error", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



export default customerRouter;
