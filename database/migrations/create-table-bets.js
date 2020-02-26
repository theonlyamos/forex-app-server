module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('bets', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: Sequelize.INTEGER,
      candidate_id: Sequelize.INTEGER,
      amount: Sequelize.FLOAT,
      safe: Sequelize.FLOAT,
      risk: Sequelize.FLOAT,
      earning: Sequelize.FLOAT,
    }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('bets'),
};
