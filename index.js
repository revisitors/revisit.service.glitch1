'use strict';

var Hapi = require('hapi');
var Joi = require('joi');
var nconf = require('nconf');
var level = require('level');
var uuid = require('uuid');

nconf.argv().env().file({ file: 'local.json' });

var server = Hapi.createServer(nconf.get('domain'), nconf.get('authPort'));

var routes = [
  {
    method: 'GET',
    path: '/',
    config: {
      handler: home
    }
  },
  {
    method: 'GET',
    path: '/{id}',
    config: {
      handler: getItem
    }
  },
  {
    method: 'POST',
    path: '/service',
    config: {
      handler: add
    }
  }
];

var db = level('./db', {
  createIfMissing: true,
  valueEncoding: 'json'
});

server.route(routes);

server.start();

function home(request, reply) {
  reply('messaging service');
}

function getItem(request, reply) {
  db.get(request.params.id, function (err, content) {
    if (err) {
      reply('No message found').code(404);
      return;
    }
    
    reply({
      content: content
    });
  });
}

function add(request, reply) {
  var id = uuid.v4();

  db.put(id, request.payload.content, function (err, content) {
    if (err) {
      console.log(err)
      reply('could not post message').code(400);
      return;
    }

    reply({
      id: id
    });
  });
}