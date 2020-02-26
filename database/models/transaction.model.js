const { sequelize, Sequelize } = require('../');

/**
 * TransactionModel describes 'transactions' table
 */
const TransactionModel = sequelize.define(
  'Transactions',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    payment_id: Sequelize.INTEGER,
    user_id: Sequelize.INTEGER,
    transaction_date: Sequelize.DATE,
    credit_number: Sequelize.STRING,
    credit_name: Sequelize.STRING,
    payment_address: Sequelize.STRING,
    country: Sequelize.STRING,
    type: Sequelize.STRING,
    amount: Sequelize.INTEGER,
    status: Sequelize.STRING,
    transaction_ID: Sequelize.STRING,
  },
  {
    timestamps: false,
    tableName: 'transactions',
  },
);

module.exports = TransactionModel;
