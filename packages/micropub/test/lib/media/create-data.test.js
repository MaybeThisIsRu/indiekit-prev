require('dotenv').config();

const fs = require('fs');
const path = require('path');
const defaults = require('@indiekit/config-jekyll');
const test = require('ava');
const validUrl = require('valid-url');

const createData = require('../../../lib/media/create-data');

test.beforeEach(t => {
  const photo = fs.readFileSync(path.resolve(__dirname, '../fixtures/photo.jpg'));
  t.context.file = {
    buffer: Buffer.from(photo),
    mimetype: 'image/jpg',
    originalname: 'photo.jpg'
  };
  t.context.req = () => {
    const req = {};
    return req;
  };

  t.context.config = {
    'post-types': defaults['post-types'],
    me: process.env.INDIEKIT_URL
  };
});

test('Creates media data object', async t => {
  // Setup
  const req = await t.context.req();
  const mediaData = await createData(req, t.context.file, t.context.config);

  // Test assertions
  t.is(mediaData.type, 'photo');
  t.regex(mediaData.path, /\b[\d\w]{5}\b/g);
  t.truthy(validUrl.isUri(mediaData.url));
});

test('Throws error if problem with specified file', async t => {
  const req = await t.context.req();
  const error = await t.throwsAsync(createData(req, null, t.context.config));
  t.is(error.message, 'No file included in request');
});
