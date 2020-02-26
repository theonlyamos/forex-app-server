const _ = require('lodash');
const EventModel = require('../../../database/models/event.model');
const { FOREX_EVENT, EVENT } = require('../constants/event-type.constants');

class EventListService {
  static get all() {
    return this.eventList || [];
  }

  static getAllByType(eventsType) {
    return this.all.filter(({ type }) => type === eventsType);
  }

  static get(index) {
    return this.eventList[index];
  }

  static create(data) {
    const event = _.cloneDeep(data);
    this.eventList.push(event);
    return event;
  }

  static createAndReturnIndex(data) {
    const event = _.cloneDeep(data);
    return this.eventList.push(event) - 1;
  }

  static async update(index, data) {
    const newEvent = _.cloneDeep({ ...this.eventList[index], ...data });
    const event = this.eventList[index];

    if (data.biggestRisk !== event.biggestRisk) {
      const { id, biggestRisk: biggest_risk } = event;
      let eventModel = null;

      event.type === FOREX_EVENT && (eventModel = await EventModel.findById(id));
      event.type === EVENT && (eventModel = await EventModel.findById(id));

      eventModel && biggest_risk !== eventModel.biggestRisk && (await eventModel.update({ biggest_risk }));
    }

    return (this.eventList[index] = newEvent);
  }

  static destroy(index) {
    const eventListClone = _.cloneDeep(this.eventList);
    eventListClone.splice(index, 1);
    this.eventList = eventListClone;
  }
}

EventListService.eventList = [];

module.exports = EventListService;
