const http = require('http');

class HttpService {
  static get(url) {
    return new Promise((resolve, reject) =>
      http
        .get(url, res => {
          const { statusCode } = res;
          const contentType = res.headers['content-type'];

          let error;

          if (statusCode !== 200) {
            error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
          } else if (!/^application\/json/.test(contentType)) {
            error = new Error(
              'Invalid content-type.\n' + `Expected application/json but received ${contentType}`,
            );
          }

          if (error) {
            return reject(error);
          }

          res.setEncoding('utf8');

          let rawData = '';

          res.on('data', chunk => (rawData += chunk)).on('end', () => {
            try {
              resolve(JSON.parse(rawData));
            } catch (e) {
              reject(e.message);
            }
          });
        })
        .on('error', e => reject(e.message)),
    );
  }
}

module.exports = HttpService;
