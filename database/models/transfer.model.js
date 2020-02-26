const { sequelize, Sequelize } = require('../');

/**
 * TransferModel describes 'transfers' table
 */
const TransferModel = sequelize.define(
  'Transfers',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    from_user_id: Sequelize.INTEGER,
    to_user_id: Sequelize.INTEGER,
    transfer_date: Sequelize.DATE,
    action: Sequelize.STRING,
    amount: Sequelize.INTEGER,
  },
  {
    timestamps: false,
    tableName: 'transfers',
  },
);

module.exports = TransferModel;
