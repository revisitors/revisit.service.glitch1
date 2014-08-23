'use strict';

var Hapi = require('hapi');
var nconf = require('nconf');
var uuid = require('uuid');
var gm = require('gm');
var dataURI = require('data-uri-to-buffer');

nconf.argv().env().file({ file: 'local.json' });

var server = Hapi.createServer(nconf.get('domain'), nconf.get('port'));

var routes = [
  {
    method: 'GET',
    path: '/',
    config: {
      handler: home
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

server.route(routes);

server.start();

function home(request, reply) {
  reply('messaging service');
}

function randomize() {
  return Math.floor(Math.random() * (250 - 10)) + 10;
}

function add(request, reply) {
  var content = request.payload.content;

  try {
    var buffered = dataURI(content.data);
    var contentType = buffered.type.split('/')[1].toLowerCase();

    gm(buffered, 'image.' + contentType)
      .options({ imageMagick: true })
      .contrast(6)
      .colorize(randomize(), randomize(), randomize())
      .cycle(5)
      .toBuffer(contentType, function (err, buffer) {
        if (err) {
          throw err;
        }

        reply({
          content: {
            data: 'data:image/' + contentType + ';base64,' + buffer.toString('base64')
          },
          meta: request.payload.meta || {}
        });
      });
  } catch (err) {
    reply({
      content: {
        data: content
      },
      meta: request.payload.meta || {}
    });
  }
}
