module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      payment_id: Sequelize.INTEGER,
      user_id: Sequelize.INTEGER,
      transaction_date: Sequelize.DATE,
      credit_number: Sequelize.STRING,
      credit_name: Sequelize.STRING,
      payment_address: Sequelize.STRING,
      country: Sequelize.STRING,
      type: Sequelize.STRING,
      amount: Sequelize.INTEGER,
      status: Sequelize.STRING,
    }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('transactions'),
};
