const fs = require('fs');
const path = require('path');
const nock = require('nock');
const test = require('ava');
const Publisher = require('@indiekit/publisher-github');

const outputDir = path.join(process.env.PWD, '.ava_output');
const utils = require('../.');

const github = new Publisher({
  token: 'abc123',
  user: 'user',
  repo: 'repo'
});

test('Adds data to an array, creating it if doesn’t exist.', t => {
  t.deepEqual(utils.addToArray(null, 'baz'), ['baz']);
  t.deepEqual(utils.addToArray(['foo', 'bar'], 'baz'), ['foo', 'bar', 'baz']);
});

test('Removes falsey values if provided object is an array', t => {
  // Setup
  const obj = [1, null, 2, undefined, 3, false, ''];
  const result = [1, 2, 3];

  // Test assertions
  t.deepEqual(utils.cleanArray(obj), result);
});

test('Recursively removes empty, null and falsy values from an object', t => {
  // Setup
  const obj = {
    array: [1, null, 2, undefined, 3, false],
    key: 'value',
    empty: '',
    true: true,
    false: false,
    null: null,
    undefined,
    object: {
      key: 'value',
      empty: '',
      true: true,
      false: false,
      null: null,
      undefined,
      nested: {
        key: 'value',
        empty: '',
        true: true,
        false: false,
        null: null,
        undefined
      }
    }
  };
  const result = {
    array: [1, 2, 3],
    key: 'value',
    true: true,
    object: {
      key: 'value',
      true: true,
      nested: {
        key: 'value',
        true: true
      }
    }
  };

  // Test assertions
  t.deepEqual(utils.cleanObject(obj), result);
});

test('Decodes form-encoded string', t => {
  t.false(utils.decodeFormEncodedString({foo: 'bar'}));
  t.is(utils.decodeFormEncodedString('foo+bar'), 'foo bar');
  t.is(utils.decodeFormEncodedString('http%3A%2F%2Ffoo.bar'), 'http://foo.bar');
});

test('Fetches remote JSON file', async t => {
  // Mock request
  const scope = nock('https://website.example')
    .get('/foo.json')
    .reply(200, {
      bar: 'baz'
    });

  // Setup
  const response = await utils.fetchJson('https://website.example/foo.json');

  // Test assertions
  t.deepEqual(response, {bar: 'baz'});
  scope.done();
});

test('Throws error fetching remote JSON file', async t => {
  // Mock request
  const scope = nock('https://website.example')
    .get('/foo.json')
    .replyWithError('unknown error');

  // Setup
  const error = await t.throwsAsync(utils.fetchJson('https://website.example/foo.json'));

  // Test assertions
  t.regex(error.message, /\bunknown error\b/);
  scope.done();
});

test('Formats a date', t => {
  t.is(utils.formatDate('2019-11-30', 'DDD'), '30 November 2019');
});

test('Returns an array of available categories', async t => {
  const result = await utils.getCategories(['foo', 'bar']);
  t.deepEqual(result, ['foo', 'bar']);
});

test('Returns an array of available categories from remote JSON file', async t => {
  // Mock request
  const scope = nock('https://website.example')
    .get('/categories.json')
    .reply(200, ['foo', 'bar']);

  // Setup
  const result = await utils.getCategories({
    url: 'https://website.example/categories.json'
  });

  // Test assertions
  t.deepEqual(result, ['foo', 'bar']);
  scope.done();
});

test('Gets remote configuration file', async t => {
  // Mock request
  let content = {
    'syndicate-to': [{
      uid: 'https://twitter.com/username/',
      name: '@username on Twitter'
    }, {
      uid: 'https://mastodon.social/@username',
      name: '@username on Mastodon'
    }]
  };
  content = Buffer.from(JSON.stringify(content)).toString('base64');
  const scope = nock('https://api.github.com')
    .get(uri => uri.includes('config.json'))
    .reply(200, {
      content,
      sha: '\b[0-9a-f]{5,40}\b',
      name: 'config.json'
    });

  // Setup
  const result = await utils.getConfig('config.json', github, outputDir);

  // Test assertions
  t.truthy(result['syndicate-to']);
  scope.done();
});

test('Throws error getting remote configuration file', async t => {
  // Mock request
  const scope = nock('https://api.github.com')
    .get(uri => uri.includes('config.json'))
    .replyWithError('not found');

  // Setup
  const error = await t.throwsAsync(utils.getConfig('config.json', github, outputDir));

  // Test assertions
  t.regex(error.message, /\bnot found\b/);
  scope.done();
});

test('Returns false if no config path provided', async t => {
  const result = await utils.getConfig(null, github, outputDir);
  t.false(result);
});

test('Get post types combined from default and user configuration files', async t => {
  const defaults = {
    'post-types': [{
      type: 'note',
      name: 'Note',
      icon: ':notebook_with_decorative_cover:'
    }, {
      type: 'photo',
      name: 'Photo',
      icon: ':camera:'
    }]
  };
  const config = {
    'post-types': [{
      type: 'note',
      name: 'Memo',
      icon: ':memo:'
    }, {
      type: 'photo',
      name: 'Picture'
    }, {
      type: 'overheard',
      name: 'Overheard',
      icon: ':speech_balloon:'
    }]
  };
  const result = await utils.getPostTypes(defaults, config);

  t.deepEqual(result, [{
    type: 'note',
    name: 'Memo',
    icon: ':memo:'
  }, {
    type: 'photo',
    name: 'Picture',
    icon: ':camera:'
  }, {
    type: 'overheard',
    name: 'Overheard',
    icon: ':speech_balloon:'
  }]);
});

test('Get configuration for a given post type', t => {
  const result = utils.getPostTypeConfig({
    'post-types': [{
      type: 'note',
      name: 'Note'
    }, {
      type: 'photo',
      name: 'Photo'
    }]
  }, 'note');
  t.is(result.name, 'Note');
});

test('Renders a template string using context data', t => {
  const template = '{{ name }} walks into {{ location }}';
  const context = {
    name: 'Foo',
    location: 'Bar'
  };
  t.is(utils.render(template, context), 'Foo walks into Bar');
});

test('Renders a template string with a date using context data', t => {
  const template = 'Published {{ published | date(\'dd LLLL yyyy\') }}';
  const context = {
    name: 'Foo',
    published: '2019-02-27'
  };
  t.is(utils.render(template, context), 'Published 27 February 2019');
});

test('Renders GFM emoji', t => {
  t.is(utils.renderEmoji(':smile:'), '😄');
});

test('Throws error if required context data is missing', t => {
  const template = 'Published {{ published }}';
  const context = {
    name: 'Foo'
  };
  const error = t.throws(() => {
    utils.render()(template, context);
  });
  t.is(error.message, 'src must be a string or an object describing the source');
});

test('Renders Markdown string as HTML', t => {
  const block = utils.renderMarkdown('**bold**');
  const inline = utils.renderMarkdown('**bold**', 'inline');
  t.is(block, '<p><strong>bold</strong></p>\n');
  t.is(inline, '<strong>bold</strong>');
});
