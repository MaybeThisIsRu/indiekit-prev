const microformats = require(__basedir + '/lib/microformats');
const response = require(__basedir + '/lib/micropub/response');

/**
 * Returns an object containing information about this application
 *
 * @param {String} query Identifier
 * @param {Object} pubConfig Publication configuration
 * @param {String} appUrl URL of application
 * @returns {Promise} Query object
 */
module.exports = async (query, pubConfig, appUrl) => {
  const mediaEndpoint = pubConfig['media-endpoint'] || `${appUrl}/media`;
  const syndicateTo = pubConfig['syndicate-to'] || [];

  if (query.q === 'config') {
    return {
      code: 200,
      body: {
        'media-endpoint': mediaEndpoint,
        'syndicate-to': syndicateTo
      }
    };
  }

  if (query.q === 'source') {
    return {
      code: 200,
      body: await microformats.urlToMf2(query.url, query.properties)
    };
  }

  if (query.q === 'syndicate-to') {
    return {
      code: 200,
      body: {
        'syndicate-to': syndicateTo
      }
    };
  }

  return response.error('invalid_request');
};
