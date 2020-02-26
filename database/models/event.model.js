const { sequelize, Sequelize } = require('../');
const ResultModel = require('./result.model');
const BetModel = require('./bet.model');
const CandidateModel = require('./candidate.model');
const EventCandidateModel = require('./event-candidate.model');
const EventBetModel = require('./event-bet.model');
const EventResultModel = require('./event-result.model');

/**
 * EventModel describes 'events' table
 */
const EventModel = sequelize.define(
  'Events',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    parent_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    name: Sequelize.STRING,
    main_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    description: Sequelize.STRING,
    start_date: Sequelize.INTEGER,
    end_date: Sequelize.INTEGER,
    bcd: Sequelize.INTEGER,
    commission: Sequelize.FLOAT,
    biggest_risk: {
      type: Sequelize.FLOAT,
      defaultValue: 0,
    },
  },
  {
    timestamps: false,
    tableName: 'events',
  },
);

// /**
//  * Describes event <=> result relationship
//  */
EventModel.belongsToMany(ResultModel, {
  as: 'Results',
  through: {
    model: EventResultModel,
    unique: false,
    scope: {
      event_type: 'EVENT',
    },
  },
  foreignKey: 'event_id',
});

ResultModel.belongsToMany(EventModel, {
  as: 'Event',
  through: {
    model: EventResultModel,
    unique: false,
    scope: {
      event_type: 'EVENT',
    },
  },
  foreignKey: 'result_id',
});

// /**
//  * Describes event <=> bets relationship
//  */
EventModel.belongsToMany(BetModel, {
  as: 'Bets',
  through: {
    model: EventBetModel,
    unique: false,
    scope: {
      event_type: 'EVENT',
    },
  },
  foreignKey: 'event_id',
});

BetModel.belongsToMany(EventModel, {
  as: 'Event',
  through: {
    model: EventBetModel,
    unique: false,
    scope: {
      event_type: 'EVENT',
    },
  },
  foreignKey: 'bet_id',
});

/**
 * Describes event <=> candidates relationship
 */
EventModel.belongsToMany(CandidateModel, {
  as: 'Candidates',
  through: {
    model: EventCandidateModel,
    unique: false,
    scope: {
      event_type: 'EVENT',
    },
  },
  foreignKey: 'event_id',
});

CandidateModel.belongsToMany(EventModel, {
  as: 'Event',
  through: {
    model: EventCandidateModel,
    unique: false,
    scope: {
      event_type: 'EVENT',
    },
  },
  foreignKey: 'candidate_id',
});

module.exports = EventModel;
