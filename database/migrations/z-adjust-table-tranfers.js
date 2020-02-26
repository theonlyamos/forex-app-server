module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.changeColumn(
        'transfers',
        'transfer_date', Sequelize.DATE
       ),
      queryInterface.addColumn(
        'transfers',
        'action', Sequelize.STRING
      )
    ]);
  }, 
};
