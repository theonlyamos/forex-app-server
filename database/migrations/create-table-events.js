module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('events', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      name: Sequelize.STRING,
      main_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: Sequelize.STRING,
      start_date: Sequelize.DATE,
      end_date: Sequelize.DATE,
      bcd: Sequelize.INTEGER,
      commission: Sequelize.FLOAT,
      biggest_risk: Sequelize.FLOAT,
    }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('events'),
};
