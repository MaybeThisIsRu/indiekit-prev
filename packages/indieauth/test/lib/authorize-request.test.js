const nock = require('nock');
const test = require('ava');

const authorizeRequest = require('../../lib/authorize-request');

const tokenEndpoint = 'https://tokens.indieauth.com';
const me = 'https://website.example';

test.beforeEach(t => {
  t.context.token = 'JWT';
  t.context.me = me;
});

test('Returns access token if `headers.authorization` is authorized by token endpoint', async t => {
  // Setup
  const token = {
    client_id: 'https://client.example/',
    scope: 'create update delete media',
    me
  };
  const scope = nock(tokenEndpoint)
    .get('/token')
    .reply(200, token);
  const opts = {
    me,
    tokenEndpoint: `${tokenEndpoint}/token`
  };
  const req = {
    headers: {
      authorization: `Bearer ${t.context.token}`
    }
  };
  const result = await authorizeRequest(opts, req);

  // Test assertions
  t.deepEqual(result, token);
  scope.done();
});

test('Returns access token if `body.access_token` is authorized by token endpoint', async t => {
  // Setup
  const token = {
    client_id: 'https://client.example/',
    scope: 'create update delete media',
    me
  };
  const scope = nock(tokenEndpoint)
    .get('/token')
    .reply(200, token);
  const opts = {
    me,
    tokenEndpoint: `${tokenEndpoint}/token`
  };
  const req = {
    body: {
      access_token: t.context.token
    }
  };
  const result = await authorizeRequest(opts, req);

  // Test assertions
  t.deepEqual(result, token);
  scope.done();
});

test('Throws error if publication URL not provided', async t => {
  // Setup
  const token = {
    client_id: 'https://client.example/',
    scope: 'create update delete media',
    me
  };
  const scope = nock(tokenEndpoint)
    .get('/token')
    .reply(200, token);
  const opts = {
    tokenEndpoint: `${tokenEndpoint}/token`
  };
  const req = {
    headers: {
      authorization: `Bearer ${t.context.token}`
    }
  };
  const error = await t.throwsAsync(authorizeRequest(opts, req));

  // Test assertions
  t.is(error.status, 500);
  t.is(error.message, 'No publication URL provided');
  scope.done();
});

test('Throws error if publication URL doesn’t match that in token', async t => {
  // Setup
  const token = {
    client_id: 'https://client.example/',
    scope: 'create update delete media',
    me
  };
  const scope = nock(tokenEndpoint)
    .get('/token')
    .reply(200, token);
  const opts = {
    me: 'https://foo.bar',
    tokenEndpoint: 'https://tokens.indieauth.com/token'
  };
  const req = {
    headers: {
      authorization: `Bearer ${t.context.token}`
    },
    session: {
      token: {
        scope: 'create'
      }
    }
  };
  const error = await t.throwsAsync(authorizeRequest(opts, req));

  // Test assertions
  t.is(error.status, 403);
  t.is(error.message, 'User does not have permission to perform request');
  scope.done();
});
