const { sequelize, Sequelize } = require('../');
const ResultInfoModel = require('./result-info.model');
/**
 * ResultModel describes 'results' table
 */
const ResultModel = sequelize.define(
  'Results',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    candidate_id: Sequelize.INTEGER,
  },
  {
    timestamps: false,
    tableName: 'results',
  },
);

/**
 * Describes result <=> result info models relationship
 */
ResultModel.hasMany(ResultInfoModel, { foreignKey: 'result_id' });
ResultInfoModel.belongsTo(ResultModel, { foreignKey: 'id' });

module.exports = ResultModel;
