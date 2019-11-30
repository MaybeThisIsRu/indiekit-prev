const debug = require('debug')('indiekit:indieauth:checkTokenScope');
const HttpError = require('http-errors');

/**
 * Checks if scope(s) in authenticated token contains required scope.
 * Automatically handles `post` and `create` as the same thing.
 *
 * @exports checkTokenScope
 * @param {Object} opts Module options
 * @param {String} requiredScope Required scope
 * @return {Boolean} True if tokenScope includes requiredScope
 */
module.exports = (opts, requiredScope) => {
  if (!opts.token) {
    throw new HttpError.Unauthorized('No access token provided');
  }

  const {scope} = opts.token;
  if (!scope) {
    throw new HttpError.Unauthorized('No scope(s) provided by access token');
  }

  if (!requiredScope) {
    throw new HttpError.BadRequest('No scope provided in request');
  }

  debug('Required scope: %s', requiredScope);
  debug('Token scope: %s', scope);
  const scopes = scope.split(' ');
  let hasScope = scopes.includes(requiredScope);

  // Create and post are equal
  if (requiredScope === 'post' && !hasScope) {
    hasScope = scopes.includes('create');
  }

  if (requiredScope === 'create' && !hasScope) {
    hasScope = scopes.includes('post');
  }

  if (hasScope) {
    return true;
  }

  throw new HttpError.Unauthorized(`Access token does not meet requirements for requested scope (${requiredScope})`);
};
