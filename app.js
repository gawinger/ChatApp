if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// npm modules
const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

const sharedsession = require("express-socket.io-session");

// express
const app = express();
const path = require("path");

// models
const User = require("./schemas/userSchema");
const Room = require("./schemas/roomSchema");

// middleware
const { checkAuthentication, checkNotAuthenticated } = require("./utils/middleware");
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: false }));

// utilities
const { createMessage } = require("./utils/messages");
const { addUser, getUsersInRoom, removeUser } = require("./utils/user");

// socket io
const http = require("http").Server(app);
const io = require("socket.io")(http);

// views and public directories
app.use(express.static(path.join(__dirname, "/public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// session
const session = require("express-session")({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
});
const MongoStore = require("connect-mongo")(require("express-session"));
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/scouter";
const store = new MongoStore({
  url: dbUrl,
  secret: process.env.SESSION_SECRET,
  touchAfter: 24 * 60 * 60,
});
store.on("error", function (e) {
  console.log("Session Store Error!", e);
});
app.use(session);
io.use(sharedsession(session));

// Database connection
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Succesfully connected to database");
});

// passport config
const LocalStrategy = require("passport-local").Strategy;
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// flash and user locals
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Home page
app.get("/", (req, res) => {
  res.render("home");
});

// All chatrooms
app.get("/chatrooms", checkAuthentication, async (req, res) => {
  const chatrooms = await Room.find({});
  res.render("chatrooms", { chatrooms });
});

// New chatroom form
app.get("/chatrooms/new", checkAuthentication, async (req, res) => {
  res.render("new-chatroom");
});

// Create new chatroom
app.post("/chatrooms", checkAuthentication, async (req, res) => {
  try {
    const { name, password, description, tags } = req.body;
    const createdBy = res.locals.currentUser.username;
    const room = await new Room({ name, password, description, tags, createdBy });
    await room.save();
    res.redirect(`chatrooms/${room.id}`);
  } catch (err) {
    err.message.includes("E11000 duplicate key error collection") ? (err.message = "This name is already taken") : null;
    req.flash("error", err.message);
    res.redirect("/chatrooms/new");
  }
});

// Show chatroom with specified ID
app.get("/chatrooms/:id", checkAuthentication, async (req, res) => {
  const { id } = req.params;
  const room = await Room.findById(id);
  res.render("show-chatroom", { room });
});

// Render password page for chatroom with specified ID
app.get("/chatrooms/:id/password", checkAuthentication, async (req, res) => {
  const { id } = req.params;
  const room = await Room.findById(id);
  res.render("chatroom-password", { room });
});

// Attempt to enter with provided password
app.post("/chatrooms/:id/password", checkAuthentication, async (req, res) => {
  const { id } = req.params;
  const room = await Room.findById(id);
  if (room.password === req.body.password) {
    res.render("show-chatroom", { room });
  } else {
    req.flash("error", "Wrong Password");
    res.render("chatroom-password", { room });
  }
});

// Delete chatroom
app.delete("/chatrooms/:id", checkAuthentication, async (req, res) => {
  const { id } = req.params;
  const room = await Room.findById(id);
  if (req.user.username === room.createdBy || req.user.username === "admin") {
    await Room.findByIdAndDelete(id);
    res.redirect("/chatrooms");
    req.flash("success", "Succesfully deleted chatroom");
  } else {
    res.redirect("/chatrooms");
    req.flash("error", "You do not have permission to do that");
  }
});

// Show register form
app.get("/register", checkNotAuthenticated, async (req, res) => {
  res.render("register");
});

// Create new account
app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newUser = await User.register(new User({ username, email }), password);
    req.login(newUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome! Have fun!");
      res.redirect("/chatrooms");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/register");
  }
});

// Show login form
app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login");
});

// Login user
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    const requestedUrl = req.session.returnTo || "/chatrooms";
    delete req.session.returnTo;
    req.flash("success", "Succesfully logged in!");
    res.redirect(requestedUrl);
  }
);

// Logout
app.get("/logout", checkAuthentication, (req, res) => {
  req.flash("success", "Goodbye");
  req.logOut();
  delete req.session.returnTo;
  res.redirect("/");
});

// Delete user
app.delete("/users/:id", checkAuthentication, async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  res.redirect("/chatrooms");
});

io.on("connection", (socket) => {
  socket.on("join", async (roomId) => {
    try {
      // get user from session
      const { user } = socket.handshake.session.passport;
      // join to room
      socket.join(roomId);
      addUser(user, roomId);
      // set joined room to active room
      socket.activeRoom = roomId;
      // Emit welcome message on join
      socket.emit("joined", createMessage(user, ", Welcome!"));
      // To users already in room send message that new user has entered
      socket.broadcast.to(roomId).emit("joined", createMessage(user, " has joined!"));
      io.to(roomId).emit("activeUsers", getUsersInRoom(roomId));
    } catch (err) {
      req.flash("error", "Something went wrong, try again.");
    }
  });

  socket.on("sendMessage", (message) => {
    io.to(socket.activeRoom).emit("message", createMessage(socket.handshake.session.passport.user, message));
  });

  // On disconnect emit message for all users and update user list
  socket.on("disconnect", () => {
    const { user } = socket.handshake.session.passport;
    const removedUser = removeUser(user, socket.activeRoom);
    if (removedUser) {
      io.to(socket.activeRoom).emit("joined", createMessage(user, " has left the chat..."));
      io.to(socket.activeRoom).emit("activeUsers", getUsersInRoom(socket.activeRoom));
    }
  });
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log("LISTENING ON PORT 3000");
});
