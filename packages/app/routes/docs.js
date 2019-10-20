const path = require('path');
const express = require('express');
const {utils} = require('@indiekit/support');

const router = new express.Router();

router.get('*', (req, res, next) => {
  try {
    const filepath = path.join(__dirname, '../', req.originalUrl);
    const file = utils.resolveFilePath(filepath, 'md');
    const content = utils.renderDocument(file, res.locals);

    res.render('_document', {
      page: content.page,
      title: content.title,
      content: content.body
    });
  } catch (error) {
    next();
  }
});

module.exports = router;
