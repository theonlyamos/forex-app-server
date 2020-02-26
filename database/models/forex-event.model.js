const { sequelize, Sequelize } = require('../');
const ResultModel = require('./result.model');
const BetModel = require('./bet.model');
const CandidateModel = require('./candidate.model');
const EventCandidateModel = require('./event-candidate.model');
const EventBetModel = require('./event-bet.model');
const EventResultModel = require('./event-result.model');
const ForexChartModel = require('./forex-chart.model');

/**
 * ForexEventModel describes 'forex_events' table
 */
const ForexEventModel = sequelize.define(
  'ForexEvents',
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
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
    start_date: Sequelize.DATE,
    end_date: Sequelize.DATE,
    update_date: Sequelize.DATE,
    bcd: Sequelize.INTEGER,
    commission: Sequelize.FLOAT,
    tick: Sequelize.INTEGER, // millisecond
    currencies: Sequelize.STRING,
    biggest_risk: {
      type: Sequelize.FLOAT,
      defaultValue: 0,
    },
    refund: {
      type: Sequelize.ENUM,
      values: ['admin', 'clients'],
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: 'forex_events',
  },
);

// /**
//  * Describes event <=> result relationship
//  */
ForexEventModel.belongsToMany(ResultModel, {
  as: 'Results',
  through: {
    model: EventResultModel,
    unique: false,
    scope: {
      event_type: 'FOREX_EVENT',
    },
  },
  foreignKey: 'event_id',
});

ResultModel.belongsToMany(ForexEventModel, {
  as: 'ForexEvent',
  through: {
    model: EventResultModel,
    unique: false,
    scope: {
      event_type: 'FOREX_EVENT',
    },
  },
  foreignKey: 'result_id',
});

// /**
//  * Describes event <=> bets relationship
//  */
ForexEventModel.belongsToMany(BetModel, {
  as: 'Bets',
  through: {
    model: EventBetModel,
    unique: false,
    scope: {
      event_type: 'FOREX_EVENT',
    },
  },
  foreignKey: 'event_id',
});

BetModel.belongsToMany(ForexEventModel, {
  as: 'ForexEvent',
  through: {
    model: EventBetModel,
    unique: false,
    scope: {
      event_type: 'FOREX_EVENT',
    },
  },
  foreignKey: 'bet_id',
});

/**
 * Describes event <=> candidates relationship
 */
ForexEventModel.belongsToMany(CandidateModel, {
  as: 'Candidates',
  through: {
    model: EventCandidateModel,
    unique: false,
    scope: {
      event_type: 'FOREX_EVENT',
    },
  },
  foreignKey: 'event_id',
});

CandidateModel.belongsToMany(ForexEventModel, {
  as: 'ForexEvent',
  through: {
    model: EventCandidateModel,
    unique: false,
    scope: {
      event_type: 'FOREX_EVENT',
    },
  },
  foreignKey: 'candidate_id',
});

/**
 * Describes forex event <=> forex charts relationship
 */
ForexEventModel.hasMany(ForexChartModel, { as: 'Charts', foreignKey: 'event_id' });
ForexChartModel.belongsTo(ForexEventModel, { as: 'ForexEvent', foreignKey: 'id' });

module.exports = ForexEventModel;
