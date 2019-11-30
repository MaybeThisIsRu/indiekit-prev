const debug = require('debug')('indiekit:micropub');
const httpError = require('http-errors');
const microformats = require('@indiekit/microformats');

/**
 * Express middleware function for querying Micropub endpoint.
 *
 * @param {Object} req Request
 * @param {Object} postStore Previously published posts
 * @param {Object} config Publication config
 * @returns {Object} Requested information
 */
module.exports = async (req, postStore, config) => {
  try {
    const {query} = req;

    if (!query) {
      throw new Error('Request is missing query string');
    }

    if (!query.q) {
      throw new Error('Invalid query');
    }

    switch (query.q) {
      case 'config': {
        const mediaEndpoint = `${req.protocol}://${req.headers.host}/media`;
        return {
          categories: config.categories,
          'media-endpoint': config['media-endpoint'] || mediaEndpoint,
          'post-types': config['post-types'].map(postType => ({
            type: postType.type,
            name: postType.name
          })),
          'syndicate-to': config['syndicate-to']
        };
      }

      case 'category': {
        return {
          categories: config.categories
        };
      }

      case 'source': {
        if (query.url) {
          // Return source (as mf2 object) for given URL
          return microformats.urlToMf2(query.url, query.properties).catch(error => {
            throw new Error(error.message);
          });
        }

        // Return list of previously published posts
        return (postStore ? {
          items: postStore.map(post => {
            return post.mf2;
          })
        } : {});
      }

      default: {
        if (config[query.q]) {
          // Return configured property if matches provided query
          return {
            [query.q]: config[query.q]
          };
        }

        throw new Error(`Invalid parameter: ${query.q}`);
      }
    }
  } catch (error) {
    throw new httpError.BadRequest(error.message);
  }
};
