const EventListService = require('../services/event-list.service');

const formatEvent = (event, user_id, isAdmin = false) => {
  const { infos, id, candidates, status, results = [], type } = event;
  const now = new Date().getTime();
  const start = (status.start - now) / 1000;
  const end = (status.end - now) / 1000;
  const bcd = (status.bcd - now) / 1000;
  const bets = event.bets.map(bet => ({
    ...bet,
    mine: bet.user_id === user_id,
  }));
  const formatedEvent = {
    ...event,
    id,
    infos,
    status: {
      ...status,
      start,
      end,
      bcd,
      start_date: status.start,
      end_date: status.end,
      period: status.period,
    },
    candidates,
    bets,
    type,
    results: !isAdmin ? results.map(({ id, result_id, bet_id, win, lose, refund }) => ({})) : results,
  };

  return formatedEvent;
};

const formatEventForEventList = event => {
  const { infos, id, type } = event;
  const children = EventListService.getAllByType(type).filter(
    event => Number(event.parent_id) === Number(id),
  );

  return { infos, id, type, children };
};

module.exports = {
  formatEvent,
  formatEventForEventList,
};
