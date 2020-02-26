module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('payments', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: Sequelize.STRING,
      status: Sequelize.STRING,
      description: Sequelize.TEXT,
    }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('payments'),
};
