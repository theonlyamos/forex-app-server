const { sequelize, Sequelize } = require('../');
const ResultInfoModel = require('./result-info.model');

/**
 * BetModel describes 'bets' table
 */
const BetModel = sequelize.define(
  'Bets',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: Sequelize.INTEGER,
    candidate_id: Sequelize.INTEGER,
    amount: Sequelize.FLOAT,
    safe: {
      type: Sequelize.FLOAT,
      defaultValue: 0,
    },
    risk: {
      type: Sequelize.FLOAT,
      defaultValue: 0,
    },
    earning: {
      type: Sequelize.FLOAT,
      defaultValue: 0,
    },
  },
  {
    timestamps: false,
    tableName: 'bets',
  },
);

/**
 * Describes bet <=> result info relationship
 */
BetModel.hasOne(ResultInfoModel, { foreignKey: 'bet_id' });
ResultInfoModel.belongsTo(BetModel, { foreignKey: 'id' });

module.exports = BetModel;
