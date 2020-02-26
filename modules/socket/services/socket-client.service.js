const EventListService = require('./event-list.service');
const { formatEventForEventList } = require('../helpers/format-event.helper');
const { EVENT, FOREX_EVENT } = require('../constants/event-type.constants');

module.exports = {
  sendData(data = {}) {
    return this.send(JSON.stringify(data));
  },

  updateBalance() {
    return this.sendData({
      type: 'balance_update',
      data: {
        balance: this.betting.user.balance,
      },
    });
  },

  eventListUpdate() {
    return this.sendData(this.getEventList());
  },

  getEventList() {
    const eventList = EventListService.getAllByType(EVENT).filter(event => !event.parent_id);
    const forexEventList = EventListService.getAllByType(FOREX_EVENT).filter(event => !event.parent_id);

    return {
      type: 'event_list',
      data: {
        open: {
          incoming: eventList
            .filter(e => !e.status.started)
            .sort((a, b) => a.status.start - b.status.start)
            .map(event => formatEventForEventList(event)),
          ongoing: eventList
            .filter(e => e.status.started && !e.status.ended)
            .sort((a, b) => a.status.start - b.status.start)
            .map(event => formatEventForEventList(event)),
          forex: forexEventList
            .filter(event => event.results.length === 0)
            .sort((a, b) => a.status.start - b.status.start)
            .map(event => formatEventForEventList(event)),
        },
        over: eventList
          .filter(
            e =>
              e.status.ended &&
              e.results.length === 0 &&
              (e.bets.filter(b => b.user_id == this.betting.user.id).length > 0 ||
                this.betting.user.account_type == 'ADMIN'),
          )
          .sort((a, b) => a.status.end - b.status.end)
          .map(event => formatEventForEventList(event)),
        history: eventList
          .filter(
            e =>
              e.results.length > 0 &&
              (e.bets.some(b => b.user_id === this.betting.user.id) ||
                this.betting.user.account_type === 'ADMIN'),
          )
          .sort((a, b) => a.status.end - b.status.end)
          .map(event => formatEventForEventList(event))
          .concat(
            forexEventList
              .sort((a, b) => a.status.end - b.status.end)
              .filter(event => event.results.length > 0)
              .map(event => formatEventForEventList(event)),
          ),
      },
    };
  },
};
