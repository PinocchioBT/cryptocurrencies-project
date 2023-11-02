CREATE DATABASE cryptocurrencies
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'English_United States.1252'
    LC_CTYPE = 'English_United States.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

-- Create Table

CREATE TABLE users (
    user_id INT PRIMARY KEY,
    username VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    created_at TIMESTAMP
);

CREATE TABLE wallet (
    wallet_id INT PRIMARY KEY,
    user_id INT,
    currency_id INT,
    balance DECIMAL(10,2),
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (currency_id) REFERENCES cryptocurrencies(currency_id)
);

CREATE TABLE cryptocurrencies (
    currency_id INT PRIMARY KEY,
    name VARCHAR(255),
    symbol VARCHAR(10)
);

CREATE TABLE exchange_rates (
    exchange_rates_id INT PRIMARY KEY,
    from_currency_id INT,
    to_currency_id INT,
    exchange_rate DECIMAL(10,5),
    created_at TIMESTAMP,
    FOREIGN KEY (from_currency_id) REFERENCES cryptocurrencies(currency_id),
    FOREIGN KEY (to_currency_id) REFERENCES cryptocurrencies(currency_id)
);





