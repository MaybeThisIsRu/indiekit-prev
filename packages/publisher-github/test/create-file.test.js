const nock = require('nock');
const test = require('ava');
const Publisher = require('../.');

const github = new Publisher({
  token: 'abc123',
  user: 'user',
  repo: 'repo'
});

test('Creates a new file in a repository', async t => {
  // Mock request
  const scope = nock('https://api.github.com')
    .put(uri => uri.includes('foo.txt'))
    .reply(200, {
      commit: {
        message: 'Create message'
      }
    });

  // Setup
  const path = 'bar/foo.txt';
  const content = 'foo';
  const options = {
    message: 'Create message'
  };
  const response = await github.createFile(path, content, options);

  // Test assertions
  t.truthy(response);
  t.is(response.data.commit.message, 'Create message');
  scope.done();
});

test('Throws error if GitHub responds with an error', async t => {
  // Mock request
  const scope = nock('https://api.github.com')
    .put(uri => uri.includes('foo.txt'))
    .replyWithError('not found');

  // Setup
  const path = 'bar/foo.txt';
  const content = 'foo';
  const options = {
    message: 'Create message'
  };
  const error = await t.throwsAsync(github.createFile(path, content, options));

  // Test assertions
  t.regex(error.message, /\bnot found\b/);
  scope.done();
});
