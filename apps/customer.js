import { Router } from "express";
import { pool } from "../utils/db.js";

const customerRouter = Router();

customerRouter.post("/transferCryptocurrency", async (req, res) => {
  try {
    const { senderUserId, receiverUserId, fromCurrency, toCurrency, amount } =
      req.body;

    // Get sender's wallet data for the source currency
    const senderWalletQuery = `
            SELECT balance
            FROM wallet
            WHERE userId = $1 AND currencyId = $2
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
                WHERE userId = $2 AND currencyId = $3
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
                WHERE userId = $1 AND currencyId = $2
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
                WHERE userId = $2 AND currencyId = $3
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
