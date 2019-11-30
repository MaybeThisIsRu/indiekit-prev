const fs = require('fs');
const path = require('path');
const defaults = require('@indiekit/config-jekyll');
const nock = require('nock');
const test = require('ava');

const queryEndpoint = require('../../lib/query-endpoint');

const postStore = [{
  mf2: {
    type: ['h-entry'],
    properties: {
      content: ['hello world'],
      published: ['2019-08-17T23:56:38.977+01:00'],
      category: ['foo', 'bar'],
      slug: ['baz']
    }
  }
}];

test.before(t => {
  t.context.req = query => {
    const req = {
      headers: {
        host: 'endpoint.example'
      },
      protocol: 'https'
    };
    req.query = query;
    return req;
  };

  t.context.config = {
    categories: ['foo', 'bar'],
    'post-types': defaults['post-types'],
    me: process.env.INDIEKIT_URL
  };
});

test('Returns publication configuration', async t => {
  const query = await t.context.req({
    q: 'config'
  });
  const result = await queryEndpoint(query, postStore, t.context.config);
  t.is(result['media-endpoint'], 'https://endpoint.example/media');
});

test('Returns publication categories', async t => {
  const query = await t.context.req({
    q: 'category'
  });
  const result = await queryEndpoint(query, postStore, t.context.config);
  t.deepEqual(result.categories, ['foo', 'bar']);
});

test('Returns list of previously published posts', async t => {
  const query = await t.context.req({
    q: 'source'
  });
  const result = await queryEndpoint(query, postStore, t.context.config);
  t.truthy(result.items[0].properties.content[0]);
});

test('Returns source (as mf2 object) for given URL', async t => {
  // Mock request
  const file = path.resolve(__dirname, 'fixtures/html-with-mf2.html');
  const html = fs.readFileSync(file, 'utf-8');
  const scope = nock('https://website.example')
    .get('/foo')
    .reply(200, html);

  // Setup
  const query = await t.context.req({
    q: 'source',
    url: 'https://website.example/foo'
  });
  const result = await queryEndpoint(query, postStore);

  // Test assertions
  t.truthy(result.properties);
  scope.done();
});

test('Returns source (name property) for given URL', async t => {
  // Mock request
  const file = path.resolve(__dirname, 'fixtures/html-with-mf2.html');
  const html = fs.readFileSync(file, 'utf-8');
  const scope = nock('https://website.example')
    .get('/foo')
    .reply(200, html);

  // Setup
  const query = await t.context.req({
    q: 'source',
    url: 'https://website.example/foo',
    properties: 'name'
  });
  const result = await queryEndpoint(query, postStore);

  // Test assertions
  t.is(result.name[0], 'I ate a cheese sandwich.');
  scope.done();
});

test('Throws error if source URL cannot be found', async t => {
  // Mock request
  const scope = nock('https://website.example')
    .get('/foo')
    .replyWithError('not found');

  // Setup
  const query = await t.context.req({
    q: 'source',
    url: 'https://website.example/foo'
  });
  const error = await t.throwsAsync(queryEndpoint(query, postStore, t.context.config));

  // Test assertions
  t.is(error.message, 'not found');
  scope.done();
});

test('Returns any available configuration value', async t => {
  const query1 = await t.context.req({
    q: 'categories'
  });
  const result1 = await queryEndpoint(query1, postStore, t.context.config);
  const query2 = await t.context.req({
    q: 'post-types'
  });
  const result2 = await queryEndpoint(query2, postStore, t.context.config);
  t.truthy(result1.categories);
  t.truthy(result2['post-types']);
});

test('Throws error if request is missing query string', async t => {
  const query = await t.context.req(null);
  const error = await t.throwsAsync(queryEndpoint(query, postStore));
  t.is(error.status, 400);
  t.is(error.message, 'Request is missing query string');
});

test('Throws error if unsupported query provided', async t => {
  const query = await t.context.req({
    foo: 'bar'
  });
  const error = await t.throwsAsync(queryEndpoint(query, postStore, t.context.config));
  t.is(error.status, 400);
  t.is(error.message, 'Invalid query');
});

test('Throws error if unsupported parameter provided', async t => {
  const query = await t.context.req({
    q: 'foo'
  });
  const error = await t.throwsAsync(queryEndpoint(query, postStore, t.context.config));
  t.is(error.status, 400);
  t.is(error.message, 'Invalid parameter: foo');
});
