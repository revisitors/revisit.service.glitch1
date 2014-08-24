'use strict';

var Hapi = require('hapi');
var nconf = require('nconf');
var dataURI = require('data-uri-to-buffer');

var IMG_JPG_CHARS = ['CM', 'FA', 'DM'];

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

function randomizeJPG() {
  return IMG_JPG_CHARS[Math.floor(Math.random() * IMG_JPG_CHARS.length)];
}

function add(request, reply) {
  var content = request.payload.content;

  try {
    var buffered = dataURI(content.data);
    var bufferedString = buffered.toString('base64');
    var contentType = buffered.type.split('/')[1].toLowerCase();
    var imgSize = Buffer.byteLength(bufferedString);

    var headerEnd = Math.ceil(imgSize / 30);
    var bufferedHeaders = bufferedString.slice(0, headerEnd);
    var bufferedBody = bufferedString.slice(headerEnd, imgSize);

    bufferedBody = bufferedBody.replace(/(CC|DD|DE|BB)/g, randomizeJPG());

    buffered = 'data:image/' + contentType + ';base64,' + bufferedHeaders + bufferedBody;

    reply({
      content: {
        data: buffered
      },
      meta: request.payload.meta || {}
    });

  } catch (err) {
    reply({
      content: {
        data: 'data:image/' + contentType + ';base64,' + buffered.toString('base64')
      },
      meta: request.payload.meta || {}
    });
  }
}
