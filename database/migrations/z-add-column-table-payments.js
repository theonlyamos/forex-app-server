module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn(
        'payments',
        'account_address', Sequelize.STRING
      ),
      queryInterface.addColumn(
        'payments',
        'account_name', Sequelize.STRING
      ),
      queryInterface.addColumn(
        'payments',
        'country', Sequelize.STRING
      )
    ]);
  }, 
};
