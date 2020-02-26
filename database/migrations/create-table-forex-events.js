module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('forex_events', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      refund: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      name: Sequelize.STRING,
      main_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      start_date: Sequelize.DATE,
      end_date: Sequelize.DATE,
      update_date: Sequelize.DATE,
      bcd: Sequelize.INTEGER,
      commission: Sequelize.FLOAT,
      tick: Sequelize.INTEGER, // millisecond
      currencies: Sequelize.STRING,
      biggest_risk: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
    }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('forex_events'),
};
