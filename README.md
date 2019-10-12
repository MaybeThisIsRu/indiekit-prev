# IndieKit

[![Build status](https://github.com/paulrobertlloyd/indiekit/workflows/build/badge.svg)](https://github.com/paulrobertlloyd/indiekit/actions) [![Coverage status](https://coveralls.io/repos/github/paulrobertlloyd/indiekit/badge.svg?branch=master)](https://coveralls.io/github/paulrobertlloyd/indiekit?branch=master)

IndieKit is a configurable [Micropub](https://www.w3.org/TR/micropub/) endpoint that allows you to save posts to GitHub for subsequent publishing with a static site generator.

✏️ **Create posts** with JSON or `x-www-form-urlencoded` syntaxes

🔄 **Update posts** by adding, replacing or removing properties

❌ **Delete posts** with support for `delete` and `undelete` actions

🖼 **Upload media** via the media endpoint or by including `multipart/form-data` in a request

🌈 **Configure** post templates, destination paths and commit messages.

Support for additional social publishing specifications (Webmention, Microsub, ActivityPub etc.) and content management systems is planned for future releases.

## Getting started

IndieKit needs to be hosted on a public server so that it can accept and respond to requests.

### Deploy to Heroku…

The easiest way to do this is to deploy this application to Heroku. Clicking on the button below will guide you through the process:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/paulrobertlloyd/indiekit)

### …or host on your own web server

If you’d like to deploy this application on your own server, first make sure it supports [Node.js](https://nodejs.org) (v10 or above).

1. Install the application

  ```
  npm i @indiekit/app
  ```

2. Start the application:

  ```
  node @indiekit/app
  ```

4. Browse to `https://<your-endpoint>` for information about how to get started with IndieKit.

## Local development

```
npm start
```

If you want to run the service locally, perhaps to use with a tool like [Postman](https://www.getpostman.com/), ensure the required environment variables have been set.

If you’re developing a new feature and want the application to automatically restart whenever a file change is detected, you can use `npm run dev`.

### Testing

```
npm test
```

Before running any automated tests, an IndieAuth token needs to be assigned to the `TEST_INDIEAUTH_TOKEN` environment variable. This token, whose URL must match that used for `INDIEKIT_URL`, should also include `create`, `update` and `delete` scopes. [Homebrew Access Token](https://gimme-a-token.5eb.nl) is a useful tool for creating tokens for this purpose.

## Similar projects

IndieKit is inspired by similar projects made by members of the [IndieWeb community](https://indieweb.org), all of which you are encouraged to try:

* [Mastr Cntrl](https://github.com/vipickering/mastr-cntrl) by [Vincent Pickering](https://vincentp.me)
* [Micropub endpoint](https://github.com/muan/micropub-endpoint) by [Mu-An Chiou](https://muan.co)
* [Micropub to GitHub](https://github.com/voxpelli/webpage-micropub-to-github) by [Pelle Wessman](https://kodfabrik.se)
* [Postr](https://github.com/grantcodes/postr) by [Grant Richmond](https://grant.codes)
* [SiteWriter](https://github.com/gerwitz/sitewriter) by [Hans Gerwitz](https://hans.gerwitz.com)

## Credits

Logo adapted from [‘to merge’](https://www.toicon.com/icons/afiado_merge) icon by Susana Passinhas.
