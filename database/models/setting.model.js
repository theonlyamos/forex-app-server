const { sequelize, Sequelize } = require('../');

/**
 * SettingModel describes 'payments' table
 */
const SettingModel = sequelize.define(
  'Settings',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: Sequelize.STRING,
    value: Sequelize.STRING,
  },
  {
    timestamps: false,
    tableName: 'settings',
  },
);

module.exports = SettingModel;
