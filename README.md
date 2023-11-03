# Cryptocurrencies Project

## Overview
This project aims to create a cryptocurrency management system with APIs for both administrators and customers. The system allows users to perform various actions such as buying, selling, and transferring cryptocurrencies, as well as administrative tasks like managing exchange rates and user balances.

## Database Structure

### Table: Cryptocurrencies
- `currency_id`: Unique identifier for a cryptocurrency.
- `name`: Name of the cryptocurrency (e.g., Bitcoin).
- `symbol`: Symbol used to represent the cryptocurrency (e.g., BTC).

### Table: Exchange Rates
- `exchange_rates_id`: Unique identifier for an exchange rate.
- `from_currency_id`: Reference to the cryptocurrency being exchanged from.
- `to_currency_id`: Reference to the cryptocurrency being exchanged to.
- `exchange_rate`: The rate at which one cryptocurrency can be exchanged for another.
- `created_at`: Timestamp indicating when the exchange rate was recorded.

### Table: Users
- `user_id`: Unique identifier for a user.
- `username`: User's chosen username.
- `email`: User's email address.
- `password`: User's password (securely hashed).
- `created_at`: Timestamp indicating when the user account was created.
- `role`: Role or type of user (e.g., admin, customer).

### Table: Wallets
- `wallet_id`: Unique identifier for a user's wallet.
- `user_id`: Reference to the user who owns the wallet.
- `currency_id`: Reference to the cryptocurrency associated with the wallet.
- `balance`: The amount of the cryptocurrency in the wallet.
- `created_at`: Timestamp indicating when the wallet was created.

### Foreign Key Relationships
- The `from_currency_id` and `to_currency_id` in the Exchange Rates table reference the `currency_id` in the Cryptocurrencies table.
- The `user_id` in the Wallets table references the `user_id` in the Users table.
- The `currency_id` in the Wallets table references the `currency_id` in the Cryptocurrencies table.

## Dependencies
- **bcrypt (Version 5.1.1)**: Used for hashing passwords. It helps securely store user passwords in the database.
- **bignumber.js (Version 9.1.2)**: Provides a way to work with arbitrary precision numbers. Useful for precise financial calculations involving cryptocurrencies.
- **body-parser (Version 1.20.2)**: Middleware that extracts the entire body portion of an incoming request stream and exposes it on `req.body`.
- **cors (Version 2.8.5)**: Enables Cross-Origin Resource Sharing (CORS) for your Express app. It allows or restricts requested resources on a web page to be loaded from a domain other than the one the resource originated from.
- **dotenv (Version 16.3.1)**: A zero-dependency module that loads environment variables from a `.env` file into `process.env`.
- **express (Version 4.18.2)**: A fast, unopinionated, minimalist web framework for Node.js. It provides a robust set of features to develop web and mobile applications.
- **nodemon (Version 3.0.1)**: A utility that monitors for changes in files in a Node.js application and automatically restarts the server when any changes are detected. This is useful for development.
- **pg (Version 8.11.3)**: The PostgreSQL client for Node.js. It allows you to interact with a PostgreSQL database from your Node.js application.

## Getting Started (Development)
1. Clone the repository.
2. Install the required dependencies using `npm install`.
3. Start the development server using `npm start`.

## How to Import the Postman Collection
1. Download the Collection File:
   - Click on the Download button for the collection file.
   - Save it to a location on your computer.
   
2. Open Postman:
   - Launch the Postman application.
   
3. Import the Collection:
   - In the top-left corner of Postman, click on the "Import" button.
   - Choose the File:
     - A file dialog will open. Locate and select the downloaded collection file.
   
4. Collection Appears:
   - After successfully importing, you should see the collection in the left sidebar of your Postman application.

## Using the Postman Collection
You can now use the collection to test the API. Each request within the collection is organized by folders and includes detailed information in the request headers, body, and expected responses. Make sure to follow any additional instructions or notes provided in the request descriptions.

## API Structure

### Admin APIs

1. **Get Total Balance**
   - Endpoint: GET /admin/totalBalance
   - Description: Allows the admin to see the total balance of all cryptocurrencies.

2. **Add Cryptocurrency**
   - Endpoint: POST /admin/addCryptocurrency
   - Description: Enables the admin to add a new cryptocurrency to the system.

3. **Adjust User's Balance**
   - Endpoint: PUT /admin/adjustBalance/:walletId
   - Description: Allows the admin to adjust a user's wallet balance.

4. **Add Exchange Rate**
   - Endpoint: POST /admin/addExchangeRate
   - Description: Lets the admin add or update an exchange rate between two currencies.

5. **Update Exchange Rate**
   - Endpoint: PUT /admin/updateExchangeRate
   - Description: Allows the admin to update an existing exchange rate.

6. **Delete Exchange Rate**
   - Endpoint: DELETE /admin/deleteExchangeRate/:exchangeRateId
   - Description: Allows the admin to delete an exchange rate.

### Customer APIs

1. **Buy Cryptocurrency**
   - Endpoint: POST /customer/buyCryptocurrency
   - Description: Enables a customer to buy cryptocurrency.

2. **Sell Cryptocurrency**
   - Endpoint: POST /customer/sellCryptocurrency
   - Description: Allows a customer to sell cryptocurrency.

3. **Transfer Cryptocurrency**
   - Endpoint: POST /customer/transferCryptocurrency
   - Description: Allows a customer to transfer cryptocurrency to another user.

