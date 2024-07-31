const path = require("path");
const express = require("express"); // exports a top level function
const bodyParser = require("body-parser");
const multer = require("multer");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBSessionStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");

const errorController = require("./controllers/error");
const User = require("./models/user");

const MONGODB_URI =
  "mongodb+srv://himtiaz194:H12345678@cluster0.asgtm0w.mongodb.net/shop?w=majority&appName=Cluster0";

const app = express(); // creates incoming request handler
const store = new MongoDBSessionStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

const crsfProtection = csrf(); // crsf protection middleware

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    // Extract file extension
    const fileExtension = file.originalname.split(".").pop();
    // Generate a unique filename
    const uniqueFilename = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}.${fileExtension}`;
    cb(null, uniqueFilename);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.set("view engine", "ejs"); // setting express global configuration value
app.set("views", "views"); // template location

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

// this will automatically do request body parsing
app.use(bodyParser.urlencoded({ extended: false })); //  The extended option determines whether to use the querystring library
//body parser don't parse the file because file is binary
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
); // image is the name of the input
app.use(express.static(path.join(__dirname, "public"))); //to provide access to static files
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(crsfProtection);
app.use(flash());

// passing csrf token to all routes through expressJS
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// this will only execute when server start after sequelize sync
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use("/admin", adminRoutes); // adding filter segment now path will be like /admin/add-product
app.use(shopRoutes);
app.use(authRoutes);

app.use("/500", errorController.get500);
app.use(errorController.get404);
// special kind of error middleware and express auto detects it
app.use((error, req, res, next) => {
  res.status(500).render("500", {
    pageTitle: "Error",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(3000);
  })
  .catch((err) => console.log(err));
