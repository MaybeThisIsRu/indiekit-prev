const path = require('path');
const test = require('ava');

const createContent = require('../../../lib/post/create-content');

const postData = {
  type: 'note',
  path: 'foo.md',
  url: 'https://website.example/foo',
  mf2: {
    type: ['h-entry'],
    properties: {
      content: ['hello world'],
      published: ['2019-08-17T23:56:38.977+01:00'],
      category: ['foo', 'bar'],
      slug: ['baz']
    }
  }
};

const pub = {
  'post-types': [{
    type: 'note',
    template: path.resolve(__dirname, '../fixtures/template.njk')
  }]
};

test('Creates post content by populating post template with post data', async t => {
  const postContent = await createContent(postData, pub);
  t.true(postContent.includes('hello world'));
  t.true(postContent.includes('foo'));
  t.true(postContent.includes('bar'));
});

test('Throws error', async t => {
  const error = await t.throwsAsync(createContent(postData, undefined));
  t.is(error.message, 'Cannot read property \'post-types\' of undefined');
});
