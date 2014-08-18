'use strict';

var Hapi = require('hapi');
var nconf = require('nconf');
var uuid = require('uuid');
var gm = require('gm');
var Magic = require('mmmagic').Magic;

var magic = new Magic();

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

function add(request, reply) {
  var content = request.payload.content;
  var buffered = new Buffer(content.split(';base64,')[1], 'base64');

  magic.detect(buffered, function (err, mimeType) {
    if (err) {
      reply(err).code(400);
      return;
    }

    mimeType = mimeType.split(' ')[0].toLowerCase();

    gm(buffered, 'image.' + mimeType)
      .options({ imageMagick: true })
      .noise('laplacian')
      .contrast(6)
      .toBuffer(mimeType, function (err, buffer) {
        if (err) {
          console.error(err);
          return;
        }

        reply({
          content: 'data:image/' + mimeType.toLowerCase() +
            ';base64,' + buffer.toString('base64')
        });
      });
  });
}
