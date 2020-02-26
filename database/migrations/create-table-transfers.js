module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('transfers', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      from_user_id: Sequelize.INTEGER,
      to_user_id: Sequelize.INTEGER,
      transfer_date: Sequelize.INTEGER,
      amount: Sequelize.INTEGER,
    }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('transfers'),
};
