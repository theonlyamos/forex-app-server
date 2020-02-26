const EventListService = require('./event-list.service');
const BetModel = require('../../../database/models/bet.model');

class BetService {
  static async updateByEvent(event) {
    await event.bets.forEach(
      async ({ safe, risk, earning, id }) =>
        await BetModel.update({ safe, risk, earning }, { where: { id } }),
    );
  }
}

module.exports = BetService;
