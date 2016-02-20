"use strict";

var EventEmitter = require('../util/EventEmitter');
var $ = require('../util/jquery');
var __id__ = 0;

/**
  Client for Substance Hub

  Communicates via http (auth, get document) and through a websocket for
  real-time operations

  TODO: ping server from time to time to check if the session token is still valid
        we can also detect logouts by sending a message over the websocket channel
*/

function HubClient(config) {
  HubClient.super.apply(this);

  this.__id__ = __id__++;
  this.config = config;
  this._onMessage = this._onMessage.bind(this);
  // Establish websocket connection
  this._initWebSocket();
}

HubClient.Prototype = function() {

  /*
    Initialize websocket connection and handle reconnecting
  */
  this._initWebSocket = function() {
    console.log('Starting websocket connection:', this.wsUrl);

    this.ws = new window.WebSocket(this.config.wsUrl);
    this.ws.onopen = this._onWebSocketOpen.bind(this);
    this.ws.onclose = this._onWebSocketClose.bind(this);
    window.ws = this.ws; // for debugging purposes
  };

  this._onWebSocketOpen = function() {
    this.ws.addEventListener('message', this._onMessage);
    this.emit('connection', this.ws);
  };

  /*
    Reconnect if websocket gets closed for some reason
  */
  this._onWebSocketClose = function() {
    console.log('websocket connection closed. Attempting to reconnect in 5s.');
    this.ws.removeEventListener('message', this._onMessage);
    // setTimeout(function() {
    //   this._initWebSocket();
    // }.bind(this), 5000);
  };

  /*
    Delegate incoming websocket messages
  */
  this._onMessage = function(msg) {
    msg = this.deserializeMessage(msg.data);
    if (msg.scope === 'hub') {
      this.emit('message', msg);
    } else {
      console.info('Message ignored. Not sent in hub scope', msg);
    }
    
  };

  /*
    Send message via websocket channel
  */
  this.send = function(msg) {
    msg.sessionToken = this.getSessionToken();
    msg.scope = 'hub';
    this.ws.send(this.serializeMessage(msg));
  };


  /*
    A generic request method
  */
  this._request = function(method, url, data, cb) {
    var ajaxOpts = {
      type: method,
      url: url,
      contentType: "application/json; charset=UTF-8",
      dataType: "json",
      success: function(data) {
        cb(null, data);
      },
      error: function(err) {
        console.error(err);
        cb(err.responseText);
      }
    };

    if (data) {
      ajaxOpts.data = JSON.stringify(data);
    }
    $.ajax(ajaxOpts);
  };

  this.getSession = function() {
    return this._session;
  };

  this.getSessionToken = function() {
    if (this._session) {
      return this._session.sessionToken;
    } else return null;
  };

  this.getUser = function() {
    if (this._session) {
      return this._session.user;
    } else return null;
  };

  /*
    Returns true if client is authenticated
  */
  this.isAuthenticated = function() {
    return !!this._session;
  };

  /*
    Authenticate user

    Logindata consists of an object (usually with login/password properties)
  */
  this.authenticate = function(loginData, cb) {
    this._request('POST', '/hub/api/authenticate', loginData, function(err, hubSession) {
      if (err) return cb(err);
      this._session = hubSession;
      cb(null, hubSession);
    }.bind(this));
  };

  this.getDocument = function(documentId, cb) {
    this._request('GET', '/hub/api/documents/'+documentId, cb);
  };

  this.serializeMessage = function(msg) {
    return JSON.stringify(msg);
  };

  this.deserializeMessage = function(msg) {
    return JSON.parse(msg);
  };

};

EventEmitter.extend(HubClient);

module.exports = HubClient;
