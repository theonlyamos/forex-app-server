const { sequelize, Sequelize } = require('../');

/**
 * PaymentModel describes 'payments' table
 */
const PaymentModel = sequelize.define(
  'Payments',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: Sequelize.STRING,
    status: Sequelize.STRING,
    description: Sequelize.TEXT,
    account_address: Sequelize.STRING,
    account_name: Sequelize.STRING,
    country: Sequelize.STRING,
  },
  {
    timestamps: false,
    tableName: 'payments',
  },
);

module.exports = PaymentModel;
