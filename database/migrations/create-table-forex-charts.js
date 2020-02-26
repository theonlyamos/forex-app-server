module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('forex_charts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      event_id: Sequelize.INTEGER,
      price: Sequelize.FLOAT,
      time: Sequelize.INTEGER,
    }),

  down: (queryInterface, Sequelize) => queryInterface.dropTable('forex_charts'),
};
