'use strict';

const Hapi = require('@hapi/hapi');

const sitespeed = require('../lib/sitespeed');

async function callSitespeed(url) {
  const urls = [url];
  const name = new URL(urls[0]).host;
  const timestamp = Date.now();

  return await (async function run(){
    try {
      const result = await sitespeed.run({
        urls,
        browsertime: {
          iterations: 1,
          connectivity: {
            profile: 'native',
            downstreamKbps: undefined,
            upstreamKbps: undefined,
            latency: undefined,
            engine: 'external',
          },
          headless: true,
          browser: 'firefox'
        },
        sustainable: {
          enable: true,

          useGreenWebHostingAPI: true
        },
        firstParty: true,
        outputFolder: `tmp/${name}-${timestamp}`,
        name: name
      });
      return result;
    } catch (e) {
      return e;
    }
  })();
}

const server = Hapi.server({
  port: process.env.PORT || 3000,
  host: '0.0.0.0'
});

server.route({
  method: 'POST',
  path: '/',
  handler: async (request, h) => {
    const url = request.payload.url

    if (!url) {
      const msg = 'no URL received';
      return h.response(`Bad Request: ${msg}`).code(400);
    }

    if (isUrl(url)) {
      const result = await callSitespeed(url);
      if (result.errors && result.errors.length > 0) {
        return h.response(result.errors).code(400);
      } else {
        return h.response('created').code(204);
      }
    } else {
      const msg = 'bad URL received';
      return h.response(`Bad Request: ${msg}`).code(400);
    }
  },
  options: {
    auth: false,
    // validate: {
    // payload: {
    //     url: TODO
    // Insert your joi schema here
    //  https://hapi.dev/family/joi/tester/
    // Joi.string().uri({
    //   scheme: [
    //     'http',
    //     'https'
    //    ]
    // })

    // }
    // }
  }
});

const isUrl = function(url) {
  const regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
  return regexp.test(url);
}

const init = async () => {
  await server.start();
  console.log('Server running on %s', server.info.uri);
};


process.on('unhandledRejection', (err) => {

  console.log(err);
  process.exit(1);
});

init();

module.exports = server;
