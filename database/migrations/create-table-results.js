module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('results', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      candidate_id: Sequelize.INTEGER,
    }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('results'),
};
