var HubClient = require('../../collab/HubClient');

function TestHubClient(config) {
  TestHubClient.super.apply(this, arguments);
  this.ws = config.ws;
  this._session = config.session;
}

TestHubClient.Prototype = function() {
  this._initWebSocket = function() {
    this.ws = this.config.ws;
    this.ws.onopen = this._onWebSocketOpen.bind(this);
    this.ws.onclose = this._onWebSocketClose.bind(this);
    window.ws = this.ws; // for debugging purposes
  };

  this.serializeMessage = function(msg) {
    return msg;
  };

  this.deserializeMessage = function(msg) {
    return msg;
  };

};

HubClient.extend(TestHubClient);

module.exports = TestHubClient;
