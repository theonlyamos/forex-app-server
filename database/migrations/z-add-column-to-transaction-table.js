module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn(
        'transactions',
        'transaction_ID', Sequelize.STRING
      ),
    ]);
  }, 
};
