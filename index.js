'use strict';

var Hapi = require('hapi');
var nconf = require('nconf');
var dataURI = require('data-uri-to-buffer');

var IMG_JPG_CHARS = ['ñ', 'x', 'I', 'œ', '!'];

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
  reply('glitch1 service');
}

function randomizeJPG() {
  var randomA = IMG_JPG_CHARS[Math.floor(Math.random() * IMG_JPG_CHARS.length)];
  var randomB = IMG_JPG_CHARS[Math.floor(Math.random() * IMG_JPG_CHARS.length)];
  var randomC = IMG_JPG_CHARS[Math.floor(Math.random() * IMG_JPG_CHARS.length)];
  return Array(15).join(randomA + randomB + randomC);
}

function add(request, reply) {
  var content = request.payload.content;
  var buffered = dataURI(content.data);

  var randomizeSlice = function () {
    var min = Math.ceil(buffered.length / 10);
    var max = buffered.length - 500;

    return Math.floor(Math.random() * (max - min) + min);
  };

  try {
    var contentType = buffered.type.split('/')[1].toLowerCase();
    var newBuffered;

    switch (contentType) {
      case 'jpeg':
        buffered[randomizeSlice()] = randomizeJPG();
        buffered[randomizeSlice()] = randomizeJPG();
        buffered[randomizeSlice()] = randomizeJPG();
        buffered = 'data:image/' + contentType + ';base64,' + buffered.toString('base64');
        break;
      default:
        throw new Error('not a jpeg');
        break;
    }

    reply({
      content: {
        data: buffered
      },
      meta: request.payload.meta || {}
    });
  } catch (err) {
    console.log('got here')
    reply({
      content: {
        data: 'data:image/' + contentType + ';base64,' + buffered.toString('base64')
      },
      meta: request.payload.meta || {}
    });
  }
}
