module.exports = (req, res, next) => {
  // If current session, proceed to next middleware
  if (req.session && req.session.me) {
    return next();
  }

  // No current session
  res.redirect(`/sign-in?redirect=${req.originalUrl}`);
};
