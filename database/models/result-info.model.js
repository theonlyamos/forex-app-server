const { sequelize, Sequelize } = require('../');

/**
 * ResultInfoModel describes 'result-infos' table
 */
const ResultInfoModel = sequelize.define(
  'ResultInfo',
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    result_id: Sequelize.INTEGER,
    bet_id: Sequelize.INTEGER,
    win: {
      allowNull: false,
      type: Sequelize.FLOAT,
      defaultValue: 0,
    },
    lose: {
      allowNull: false,
      type: Sequelize.FLOAT,
      defaultValue: 0,
    },
    refund: {
      allowNull: false,
      type: Sequelize.FLOAT,
      defaultValue: 0,
    },
    total_refund: {
      allowNull: false,
      type: Sequelize.FLOAT,
      defaultValue: 0,
    },
  },
  {
    timestamps: false,
    tableName: 'result_infos',
  },
);

module.exports = ResultInfoModel;
