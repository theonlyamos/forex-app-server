const EventModel = require('../../../database/models/event.model');
const ForexEventModel = require('../../../database/models/forex-event.model');
const CandidateModel = require('../../../database/models/candidate.model');
const BetModel = require('../../../database/models/bet.model');
const UserModel = require('../../../database/models/user.model');
const EventCandidateModel = require('../../../database/models/event-candidate.model');
const BetService = require('../services/bat.service');
const EventListService = require('../services/event-list.service');
const { Op } = require('sequelize');
const { EVENT, FOREX_EVENT } = require('../constants/event-type.constants');
const ChartsService = require('../services/charts.service');
const _ = require('lodash');

const LoadEventsFromDB = async () => {
  const now = new Date().getTime();
  const eventCollection = await EventModel.findAll();
  const forexEventCollection = await ForexEventModel.findAll();

  await createEvents(eventCollection, now, EVENT);
  await createEvents(forexEventCollection, now, FOREX_EVENT);

  for (const event of forexEventCollection) {
    const charts = (await event.getCharts()).map(({ time, price }) => ({ time, price }));
    ChartsService.create(event.id, charts);
  }
};

const createEvents = async (events, now, type) => {
  await events.forEach(async event => {
    const [resultModel] = event.getResults && (await event.getResults());

    if (resultModel) {
      const resultInfoCollection = await resultModel.getResultInfos();
      createEvent(
        event,
        now,
        type,
        resultInfoCollection.length > 0 ? resultInfoCollection : [resultModel.id],
      );

      return void 0;
    }

    createEvent(event, now, type);
  });
};

const createEvent = async (event, now, type, results = []) => {
  const candidateCollection = await event.getCandidates();

  if (candidateCollection.length > 0) {
    const start = new Date(event.start_date).getTime();
    const end = new Date(event.end_date).getTime();
    const bcd = start + event.bcd * 60 * 1000;
    const candidates = candidateCollection.map(({ id, name }) => ({ id, name }));

    const newEvent = {
      id: event.id,
      infos: {
        name: event.name,
        mainName: event.main_name,
        desc: event.description,
      },
      status: {
        open: bcd > now,
        started: now >= start,
        ended: now >= end,
        start,
        end,
        bcd,
        period: event.bcd,
      },
      candidates,
      bets: [],
      results,
      type,
      parent_id: event.parent_id,
      biggestRisk: event.biggest_risk,
      commission: event.commission,
    };

    if (type === FOREX_EVENT) {
      newEvent.tick = event.tick;
      newEvent.refund = event.refund;
      newEvent.lastTick = event.tick;
      newEvent.currencies = event.currencies;
      newEvent.status.update = new Date(event.update_date).getTime();
      newEvent.status.start_date = new Date(event.start_date).getTime();
    }

    const betCollection = await event.getBets();
    const users = _.uniq(betCollection.map(({ user_id }) => user_id));

    if (users.length > 0) {
      const userCollection = await UserModel.findAll({
        where: { id: { [Op.in]: users } },
      });

      await betCollection.forEach(async bet => {
        const { username, id: user_id } = await userCollection.find(({ id }) => id === bet.user_id);

        newEvent.bets.push({
          id: bet.id,
          user_id,
          username,
          candidate_id: bet.candidate_id,
          bet: bet.amount,
          safe: bet.safe,
          risk: bet.risk,
          earning: bet.earning,
        });
      });
    }

    EventListService.create(newEvent);
  }
};

module.exports = LoadEventsFromDB;
