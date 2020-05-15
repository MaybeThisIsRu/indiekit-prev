const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const axios = require('axios');
const debug = require('debug')('indiekit:support');
const emoji = require('node-emoji');
const {DateTime} = require('luxon');
const nunjucks = require('nunjucks');
const markdown = require('./lib/markdown');

const utils = {
  /**
   * Add data to an array, creating it if doesn’t exist.
   *
   * @function addToArray
   * @param {Array} arr Array
   * @param {Object} data Data to add
   * @return {Array} Updated array
   */
  addToArray(arr, data) {
    if (!arr) {
      arr = [];
    }

    arr.push(data);

    return arr;
  },

  /**
   * Remove falsey values if provided object is an array.
   *
   * @function cleanArray
   * @param {Object} obj Object containing array to be cleaned
   * @return {Array|Object} Cleaned array, else original object
   */
  cleanArray(obj) {
    return _.isArray(obj) ? _.compact(obj) : obj;
  },

  /**
   * Recursively remove empty, null and falsy values from an object.
   * Adapted from Ori Drori’s answer on Stack Overflow
   * https://stackoverflow.com/a/54186837
   *
   * @function cleanObject
   * @param {Object} obj Object to clean
   * @return {Object} Cleaned object
   */
  cleanObject(obj) {
    return _.transform(obj, (prop, value, key) => {
      const isObject = _.isObject(value);
      const val = isObject ? utils.cleanArray(utils.cleanObject(value)) : value;
      const keep = isObject ? !_.isEmpty(val) : Boolean(val);

      if (keep) {
        prop[key] = val;
      }
    });
  },

  /**
   * Decode form-encoded string.
   *
   * @function decodeFormEncodedString
   * @example decodeFormEncodedString('foo+bar') => 'foo bar'
   * @example decodeFormEncodedString('http%3A%2F%2Ffoo.bar') => 'http://foo.bar'
   * @param {String} str String to decode
   * @return {String} Decoded string
   */
  decodeFormEncodedString(str) {
    if (typeof str === 'string') {
      str = str.replace(/\+/g, '%20');
      return decodeURIComponent(str);
    }

    return false;
  },

  /**
   * Fetch remote JSON file.
   *
   * @function fetchJson
   * @param {Object} filePath Path to JSON filedate
   */
  async fetchJson(filePath) {
    try {
      const response = await axios.get(filePath, {
        headers: {
          Accept: 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  },

  /**
   * Format a date.
   *
   * @function formatDate
   * @param {String} str ISO 8601 date
   * @param {String} format Tokenised date format
   * @param {String} locale Locale
   * @return {String} Formatted date
   */
  formatDate(str, format, locale = 'en-GB') {
    const date = (str === 'now') ? DateTime.local() : str;

    const datetime = DateTime.fromISO(date, {
      locale,
      zone: 'utc'
    }).toFormat(format);

    return datetime;
  },

  /**
   * Return an array of available categories.
   *
   * @exports getCategories
   * @param {Object} pubCategories Publication category configuration
   * @returns {Promise|Array} Array of categories
   */
  async getCategories(pubCategories) {
    let categories = [];

    if (pubCategories && pubCategories.url) {
      categories = utils.fetchJson(pubCategories.url);
    } else if (pubCategories && pubCategories.constructor === Array) {
      categories = pubCategories;
    }

    return categories;
  },

  /**
   * Get remote configuration file.
   *
   * @exports getConfig
   * @param {Object} configPath Path to remote configuration file
   * @param {Function} publisher Publishing function
   * @param {Function} tmpdir Temporary directory
   * @returns {Promise|Object} Configuration file
   */
  async getConfig(configPath, publisher, tmpdir) {
    let config;
    if (configPath) {
      // Get remote configuration file (if provided)
      const content = await publisher.readFile(configPath).catch(error => {
        throw new Error(error.message);
      });
      config = JSON.parse(content);
      config = await utils.updateTemplatePaths(config, publisher, tmpdir);
      return config;
    }

    return false;
  },

  /**
   * Get post types combined from default and user configuration files.
   *
   * @function getPostTypes
   * @param {Object} defaults Default configuration
   * @param {Object} config User configuration
   * @returns {Promise|Array} Post type array
   */
  async getPostTypes(defaults, config) {
    const defaultPostTypes = _.keyBy(defaults['post-types'], 'type');
    const configPostTypes = _.keyBy(config['post-types'], 'type');
    const mergedPostTypes = _.merge(defaultPostTypes, configPostTypes);
    const postTypes = _.values(mergedPostTypes);

    return postTypes;
  },

  /**
   * Get configuration for a given post type.
   *
   * @function getPostTypeConfig
   * @param {Object} config Publication config
   * @param {String} type Post type
   * @returns {Object} Post type config
   */
  getPostTypeConfig(config, type) {
    return config['post-types'].find(postType => postType.type === type);
  },

  /**
   * Fetch file from publisher and save it to filesystem.
   *
   * @function cachePublishedFile
   * @param {Object} file File to cache
   * @param {Function} cacheDir Cache directory
   * @param {Function} publisher Publishing function
   * @returns {String|Object} Cache value
   */
  async cachePublishedFile(file, cacheDir, publisher) {
    return fs.promises.access(file)
      .catch(async () => {
        debug('File not found at %s', file);
        debug('Fetching %s file from remote', file);
        const pubData = await publisher.readFile(file)
          .catch(error => {
            throw new Error(error.message);
          });

        if (pubData) {
          const cacheFile = path.basename(file);
          const cachePath = path.join(cacheDir, cacheFile);
          await fs.promises.mkdir(path.dirname(cachePath), {recursive: true});
          await fs.promises.writeFile(cachePath, pubData);

          debug('File saved to %s', cachePath);
          return cachePath;
        }
      });
  },

  /**
   * Get remote configuration file.
   *
   * @function updateTemplatePaths
   * @param {Object} config User configuratiom
   * @param {Function} publisher Publishing function
   * @param {Function} tmpdir Temporary directory
   * @returns {Promise|Array} Post type array
   */
  async updateTemplatePaths(config, publisher, tmpdir) {
    if (config['post-types']) {
      for await (const postType of config['post-types']) {
        const {template} = postType;
        const cachePath = path.join(tmpdir, 'templates');
        const cachedTemplate = await utils.cachePublishedFile(template, cachePath, publisher);
        postType.template = cachedTemplate;
      }
    }

    return config;
  },

  /**
   * Render GFM emoji.
   *
   * @function render
   * @param {String} str GFM emoji name
   * @return {String} Emoji
   */
  renderEmoji(str) {
    return emoji.get(str);
  },

  /**
   * Render a Nunjucks template string using context data.
   *
   * @function render
   * @param {String} str Template string
   * @param {String} context Context data
   * @return {String} Rendered string
   */
  render(str, context) {
    const env = new nunjucks.Environment();

    env.addFilter('date', this.formatDate);

    return env.renderString(str, context);
  },

  /**
   * Render Markdown string as HTML
   *
   * @function renderMarkdown
   * @param {String} str Markdown
   * @param {String} value If 'inline', HTML rendered without paragraph tags
   * @return {String} HTML
   *
   */
  renderMarkdown(str, value) {
    if (str) {
      if (value === 'inline') {
        return markdown.renderInline(str);
      }

      return markdown.render(str);
    }
  }
};

module.exports = utils;
