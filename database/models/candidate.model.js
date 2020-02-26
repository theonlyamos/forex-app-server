const { sequelize, Sequelize } = require('../');

/**
 * CandidateModel describes 'candidates' table
 */
const CandidateModel = sequelize.define(
  'Candidates',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: Sequelize.STRING,
  },
  {
    timestamps: false,
    tableName: 'candidates',
  },
);

module.exports = CandidateModel;
