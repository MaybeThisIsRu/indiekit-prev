const test = require('ava');

const formatMessage = require('../../../lib/utils/format-message');

const postData = {
  type: 'note'
};
const pub = {
  'post-types': [{
    type: 'note',
    icon: ':notebook_with_decorative_cover:'
  }]
};

test('Creates commit message for given post action', t => {
  const message = {
    create: formatMessage('create', postData, pub),
    delete: formatMessage('delete', postData, pub),
    undelete: formatMessage('undelete', postData, pub),
    update: formatMessage('update', postData, pub),
    upload: formatMessage('upload', postData, pub)
  };

  t.is(message.create, ':notebook_with_decorative_cover: Created note post');
  t.is(message.delete, ':x: Deleted note post');
  t.is(message.undelete, ':notebook_with_decorative_cover: Undeleted note post');
  t.is(message.update, ':notebook_with_decorative_cover: Updated note post');
  t.is(message.upload, ':framed_picture: Uploaded note');
});

test('Throws error', t => {
  const error = t.throws(() => {
    formatMessage('foo', postData, pub);
  });
  t.is(error.message, 'Unrecognized action');
});
