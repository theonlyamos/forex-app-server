const { sequelize, Sequelize } = require('../');

/**
 * EventCandidateModel describes 'event_candidates' table
 */
const EventCandidateModel = sequelize.define(
  'EventCandidate',
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    event_id: Sequelize.INTEGER,
    candidate_id: Sequelize.INTEGER,
    event_type: {
      type: Sequelize.ENUM,
      values: ['EVENT', 'FOREX_EVENT'],
    },
  },
  {
    timestamps: false,
    tableName: 'event_candidates',
  },
);

module.exports = EventCandidateModel;
