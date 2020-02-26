const { sequelize, Sequelize } = require('../');

/**
 * EventBetModel describes 'event_bets' table
 */
const EventBetModel = sequelize.define(
  'EventBet',
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    event_id: Sequelize.INTEGER,
    bet_id: Sequelize.INTEGER,
    event_type: {
      type: Sequelize.ENUM,
      values: ['EVENT', 'FOREX_EVENT'],
    },
  },
  {
    timestamps: false,
    tableName: 'event_bets',
  },
);

module.exports = EventBetModel;
