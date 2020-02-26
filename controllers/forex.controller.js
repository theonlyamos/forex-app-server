const ForexService = require('../services/forex.service');
const { FOREX_API_KEY } = process.env;
const forexService = new ForexService(FOREX_API_KEY);

class ForexController {
  static async getSymbols(req, res) {
    try {
      const response = await forexService.getSymbols();

      if (response && response.error) {
        return res.status(404).send();
      }

      res.send(response);
    } catch (e) {
      console.log(e);
      res.status(404).send();
    }
  }
}

module.exports = ForexController;
