const EventListService = require('./event-list.service');
const ChartsService = require('./charts.service');
const { FOREX_EVENT } = require('../constants/event-type.constants');
const ForexService = require('../../../services/forex.service');
const ForexChartModel = require('../../../database/models/forex-chart.model');
const ForexEventModel = require('../../../database/models/forex-event.model');

const { FOREX_API_KEY } = process.env;
const forexService = new ForexService(FOREX_API_KEY);

class TickService {
  constructor(socketService) {
    this.socketService = socketService;
  }

  get eventListService() {
    return EventListService;
  }

  get ticks() {
    return 1;
  }

  run() {
    this.tickTimer = setInterval(async () => await this.tick(), 1000 / this.ticks);
  }

  clear() {
    clearInterval(this.tickTimer);
  }

  async tick() {
    const now = new Date();
    const eventList = this.eventListService.all;
    let change = false;

    eventList.forEach((eventItem, index) => {
      const event = { ...eventItem };
      const { status: { ended, open, bcd, started, start, end } = {} } = eventItem;

      if (!ended) {
        open && bcd <= now && (event.status.open = false);
        !started && start <= now && (event.status.started = true);
        end <= now && (event.status.ended = true);
      }

      const isChangeOpen = event.status.open !== open;
      const isChangeStarted = event.status.started !== started;
      const isChangeEnded = event.status.ended !== ended;
      const isChange = isChangeOpen || isChangeStarted || isChangeEnded;

      // console.log('tick', isChange);

      if (isChange) {
        const updatedEvent = this.eventListService.update(index, event);

        isChangeEnded && this.socketService.unsubscribeUsersWithoutBets(updatedEvent);
        this.socketService.broadcastSubscription(updatedEvent);
      }

      (isChangeStarted || isChangeEnded) && (change = true);
    });

    await this.updateForexEventPrice();

    change && this.socketService.broadcastEventList();

    /*Broadcast('{"type": "tick"}');*/
  }

  async updateForexEventPrice() {
    const now = new Date().getTime();
    const forexEventList = this.eventListService.all.filter(
      event => event.results.length === 0 && event.type === FOREX_EVENT,
    );
    const forexEventForUpdatePrice = [];

    for (const event of forexEventList) {
      const index = this.eventListService.all.findIndex(
        item => item.id === event.id && item.type === event.type,
      );

      if (event.status.update <= now) {
        const forexEventModel = await ForexEventModel.findById(event.id);
        const candidateCollection = await forexEventModel.getCandidates();
        const firstModel = await ForexChartModel.findOne({ where: { event_id: event.id } });
        const [lastModel] = await ForexChartModel.findAll({
          limit: 1,
          where: {
            event_id: event.id,
          },
          order: [['time', 'DESC']],
        });

        let candidateId = 0;

        if (firstModel && lastModel) {
          if (firstModel.price > lastModel.price) {
            ({ id: candidateId } = candidateCollection.find(candidate => candidate.name === 'down'));
          } else if (firstModel.price < lastModel.price) {
            ({ id: candidateId } = candidateCollection.find(candidate => candidate.name === 'up'));
          } else {
            ({ id: candidateId } = candidateCollection.find(candidate => candidate.name === 'equal'));
          }
        }

        await this.socketService.handleUpdateResults({
          results: [candidateId],
          id: event.id,
          type: event.type,
          refund: event.refund,
        });

        continue;
      }

      if (event.lastTick === 0 && event.status.update > now) {
        forexEventForUpdatePrice.push(event);
        event.lastTick = event.tick;
      }

      event.lastTick--;
      this.eventListService.update(index, event);
    }

    const currencies = forexEventForUpdatePrice.map(event => event.currencies);

    if (currencies.length > 0) {
      try {
        const response = (await forexService.getPricesByCurrencies(currencies.join(','))) || [];

        if (response && response.error) {
          return void 0;
        }

        for (const key in response) {
          const { price, timestamp: time } = response[key];
          const event = forexEventForUpdatePrice[key];

          await ForexChartModel.create({ time, price, event_id: event.id });
          this.socketService.broadcastCharts(event, ChartsService.add(event.id, { time, price }));
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
}

module.exports = TickService;
