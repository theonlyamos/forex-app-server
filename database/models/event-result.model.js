const { sequelize, Sequelize } = require('../');

/**
 * EventResultModel describes 'event_results' table
 */
const EventResultModel = sequelize.define(
  'EventResult',
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    event_id: Sequelize.INTEGER,
    result_id: Sequelize.INTEGER,
    event_type: {
      type: Sequelize.ENUM,
      values: ['EVENT', 'FOREX_EVENT'],
    },
  },
  {
    timestamps: false,
    tableName: 'event_results',
  },
);

module.exports = EventResultModel;
