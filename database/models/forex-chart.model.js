const { sequelize, Sequelize } = require('../');

/**
 * ForexChartModel describes 'forex_charts' table
 */
const ForexChartModel = sequelize.define(
  'ForexCharts',
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    event_id: Sequelize.INTEGER,
    price: Sequelize.FLOAT,
    time: Sequelize.INTEGER,
  },
  {
    timestamps: false,
    tableName: 'forex_charts',
  },
);

module.exports = ForexChartModel;
