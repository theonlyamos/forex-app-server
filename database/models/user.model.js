const { sequelize, Sequelize } = require('../');
const ActiveTokenModel = require('../models/active-token.model');
/**
 * UserModel describes 'users' table
 */
const UserModel = sequelize.define(
  'Users',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: Sequelize.STRING,
    username: Sequelize.STRING,
    password: Sequelize.STRING,
    balance: {
      type: Sequelize.INTEGER,
      defaultValue: 1000,
    },
    account_type: {
      type: Sequelize.ENUM,
      values: ['USER', 'ADMIN'],
      defaultValue: 'USER',
    },
    referral_token: Sequelize.STRING,
    referrer_uid: Sequelize.INTEGER,
    status: Sequelize.STRING,
    mail_token: Sequelize.STRING,
    forgot_token: Sequelize.STRING,
    affiliate_balance: Sequelize.INTEGER,
  },
  {
    timestamps: false,
    tableName: 'users',
  },
);

/**
 * Describes users <=> active_token relationship
 */
UserModel.hasOne(ActiveTokenModel, { foreignKey: 'user_id' });
ActiveTokenModel.belongsTo(UserModel, { foreignKey: 'user_id' });

module.exports = UserModel;
