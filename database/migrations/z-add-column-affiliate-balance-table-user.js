module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn(
        'users',
        'affiliate_balance', {
          type: Sequelize.STRING,
          defaultValue: 0
        }
      ),
    ]);
  }, 
};
