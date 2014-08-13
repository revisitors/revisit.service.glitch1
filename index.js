'use strict';

var Hapi = require('hapi');
var nconf = require('nconf');
var level = require('level');
var uuid = require('uuid');
var gm = require('gm');
var JSONB = require('json-buffer');
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
      id: id,
      content: content
    });
  });
}

function add(request, reply) {
  var id = uuid.v4();
  var content = JSONB.parse(request.payload.content);

  magic.detect(content, function (err, mimeType) {
    if (err) {
      reply(err).code(400);
      return;
    }

    console.log('mimetype: ', mimeType)
    mimeType = mimeType.split(' ')[0];

    gm(content)
      .options({ imageMagick: true })
      .noise('laplacian')
      .toBuffer(mimeType, function (err, buffer) {
        if (err) {
          console.error(err);
          return;
        }

        db.put(id, content, function (err) {
          if (err) {
            reply('could not post image').code(400);
            return;
          }

          reply({
            content: JSONB.stringify(buffer)
          });
        });
      });
  });
}
