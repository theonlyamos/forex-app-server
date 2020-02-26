module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('event_candidates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      event_id: Sequelize.INTEGER,
      candidate_id: Sequelize.INTEGER,
      event_type: Sequelize.STRING,
    }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('event_candidates'),
};
