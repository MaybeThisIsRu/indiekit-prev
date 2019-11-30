require('dotenv').config();

const defaults = require('@indiekit/config-jekyll');
const sinon = require('sinon');
const test = require('ava');
const validUrl = require('valid-url');

const createData = require('../../../lib/post/create-data');

test.beforeEach(t => {
  t.context.req = () => {
    const req = {};
    req.body = {
      type: ['h-entry'],
      properties: {
        content: [{
          value: 'Watched Isle of Dogs. A fun yet timely story. An inventive example of stop-motion animation. A beautiful piece of graphic design. A work of art. A visual feast - with dogs!'
        }]
      }
    };
    req.is = sinon.stub().returns(req);
    req.session = sinon.stub().returns(req);
    req.status = sinon.stub().returns(req);
    req.json = sinon.stub().returns(req);
    return req;
  };

  t.context.config = {
    'post-types': defaults['post-types'],
    me: process.env.INDIEKIT_URL
  };
});

test('Creates post data object', async t => {
  const req = await t.context.req();
  const postData = await createData(req, t.context.config);
  t.is(postData.type, 'note');
  t.regex(postData.path, /\b[\d\w]{5}\b/g);
  t.truthy(validUrl.isUri(postData.url));
  t.is(postData.mf2.type[0], 'h-entry');
  t.truthy(postData.mf2.properties);
});

test('Throws error', async t => {
  const req = await t.context.req();
  const error = await t.throwsAsync(createData(req, undefined));
  t.is(error.message, 'Cannot read property \'post-types\' of undefined');
});
