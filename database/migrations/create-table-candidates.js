module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('candidates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: Sequelize.STRING,
    }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('candidates'),
};
