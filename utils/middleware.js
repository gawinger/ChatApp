// check if user is authenticated
module.exports.checkAuthentication = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash("error", "You must be logged in to do this");
    return res.redirect("/login");
  }
  next();
};

// check if user is not authenticated
module.exports.checkNotAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/rooms");
  }
  next();
};
