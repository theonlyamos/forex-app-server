module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('settings', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      key: Sequelize.STRING,
      value: Sequelize.STRING,
    }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('settings'),
};
