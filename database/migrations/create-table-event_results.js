module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('event_results', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      event_id: Sequelize.INTEGER,
      result_id: Sequelize.INTEGER,
      event_type: Sequelize.STRING,
    }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('event_results'),
};
