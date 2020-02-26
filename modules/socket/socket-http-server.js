const http = require('http');

class SocketHttpServer {
  static init() {
    this.server = http.createServer((req, res) => {
      console.log(new Date() + ' Received request for ' + req.url);
      res.writeHead(404);
      res.end();
    });
  }

  static listen(port) {
    this.server.listen(port, function() {
      console.log(`${new Date()} Server is listening on port ${port}`);
    });
  }
}

module.exports = SocketHttpServer;
