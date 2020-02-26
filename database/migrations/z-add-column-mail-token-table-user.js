module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn(
        'users',
        'mail_token', Sequelize.STRING
      ),
      queryInterface.addColumn(
        'users',
        'forgot_token', Sequelize.STRING
      )
    ]);
  }, 
};
