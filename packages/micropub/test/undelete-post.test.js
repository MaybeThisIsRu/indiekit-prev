require('dotenv').config();

const nock = require('nock');
const sinon = require('sinon');
const test = require('ava');
const validUrl = require('valid-url');
const defaults = require('@indiekit/config-jekyll');
const Publication = require('@indiekit/publication');
const Publisher = require('@indiekit/publisher-github');

const github = new Publisher({
  token: 'abc123',
  user: 'user',
  repo: 'repo'
});

const {undeletePost} = require('../.');

const mockRequest = () => {
  const req = {};
  req.status = sinon.stub().returns(req);
  req.json = sinon.stub().returns(req);
  req.app = {
    locals: {
      pub: new Publication({
        defaults,
        endpointUrl: 'https://endpoint.example',
        publisher: github,
        url: process.env.INDIEKIT_URL
      })
    }
  };
  return req;
};

test.before(t => {
  t.context.postData = {
    type: 'note',
    path: '_notes/2019-08-17-baz.md',
    url: `${process.env.INDIEKIT_URL}/notes/2019/08/17/baz`,
    mf2: {
      type: ['h-entry'],
      properties: {
        content: ['Baz']
      },
      slug: ['baz']
    }
  };
});

test('Undeletes a post', async t => {
  // Mock request
  const scope = nock('https://api.github.com')
    .put(uri => uri.includes('baz.md'))
    .reply(200);

  // Setup
  const undeleted = await undeletePost(mockRequest(), t.context.postData);

  // Test assertions
  t.truthy(validUrl.isUri(undeleted.url));
  scope.done();
});

test('Throws error if GitHub responds with an error', async t => {
  // Mock request
  const scope = nock('https://api.github.com')
    .put(uri => uri.includes('baz.md'))
    .replyWithError('not found');

  // Setup
  const error = await t.throwsAsync(undeletePost(mockRequest(), t.context.postData));

  // Test assertions
  t.regex(error.message, /\bnot found\b/);
  scope.done();
});
