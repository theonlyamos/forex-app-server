const HttpService = require('./http.service');

const protocol = 'http';
const domain = 'forex.1forge.com';
const version = '1.0.3';

class ForexService {
  constructor(key) {
    this.apiKey = key;
  }

  get url() {
    return `${protocol}://${domain}/${version}`;
  }

  async getSymbols() {
    return await HttpService.get(`${this.url}/symbols?api_key=${this.apiKey}`);
  }

  async getPricesByCurrencies(currencies = '') {
    return await HttpService.get(`${this.url}/quotes?pairs=${currencies}&api_key=${this.apiKey}`);
  }
}

module.exports = ForexService;
