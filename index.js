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
  var buffered = new Buffer(content.data.split(';base64,')[1], 'base64');

  gm(buffered, 'image.' + content.type)
    .options({ imageMagick: true })
    .noise('laplacian')
    .colors(4)
    .toBuffer(content.type.split('/')[1], function (err, buffer) {
      if (err) {
        console.error(err);
        return;
      }

      reply({
        content: {
          type: content.type,
          data: 'data:' + content.type + ';base64,' + buffer.toString('base64')
        },
        meta: {
          audio: {
            type: false,
            data: false
          }
        }
      });
    });
}
