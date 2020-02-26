module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      email: Sequelize.STRING,
      username: Sequelize.STRING,
      password: Sequelize.STRING,
      balance: Sequelize.INTEGER,
      account_type: {
        type: Sequelize.ENUM,
        values: ['USER', 'ADMIN'],
      },
      referral_token: Sequelize.STRING,
      referrer_uid: Sequelize.INTEGER,
    }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('users'),
};
