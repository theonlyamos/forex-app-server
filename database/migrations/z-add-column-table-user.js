module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn(
        'users',
        'status', {
          type: Sequelize.STRING,
          defaultValue: 'Active'
        }
      )
    ]);
  }, 
};
