const express = require("express");
const users = require("./public/json/users.json");
const admin = require("./public/json/admin.json");
const path = require("path");
const { Timestamp } = require("firebase/firestore");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const { getUserInfo } = require("./helper");

const app = express();
const PORT = 3000;
// const HOST = '0.0.0.0';

app.listen(PORT, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});

const {
  insert,
  getData,
  signInUser,
  getAllData,
  getCount,
  updateConter,
  getAllUserData,
} = require("./database");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  context = {
    users: users,
    admin: admin,
  };

  res.render("index", context);
});

app.post("/getAllUser", (req, res) => {
  let usernames = new Array();

  users.forEach((user) => {
    usernames.push(user.username);
  });

  res.send({
    users: usernames,
  });
});

app.get("/login/:worker", (req, res) => {
  const context = {
    isError: false,
    page: req.params["worker"],
  };

  res.render("login", context);
});

app.post("/admin", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (email != "admin@stickman.com") {
    context = {
      isError: true,
      error: "Please enter the admin email id",
      page: "admin",
    };
    res.render("login", context);
  } else {
    signInUser(email, password)
      .then((userdata) => {
        getAllData()
          .then((data) => {
            res.render("admin", {
              email: email,
              entries: data,
              startDate: "",
              endDate: "",
            });
          })
          .catch((err) => {
            context = {
              users: users,
              admin: admin,
            };

            res.render("index", context);
          });
      })
      .catch((err) => {
        const context = {
          isError: true,
          error: "wrong password",
          page: "admin",
        };
        res.render("login", context);
      });
  }
});

app.post("/user", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  let flag = false;
  let username = "";

  users.forEach((user) => {
    if (user["email"] == email) {
      flag = true;
      username = user["username"];
    }
  });

  if (flag == false) {
    context = {
      isError: true,
      error: "Please enter the user email id",
      page: "user",
    };
    res.render("login", context);
  } else {
    const per = (await getData("persons"))[0]["name"];
    const allEntries = await getAllUserData(username);

    signInUser(email, password)
      .then((userdata) => {
        const context = {
          persons: per,
          username: username,
          entries: allEntries,
          showData: true,
        };

        res.render("users", context);
      })
      .catch((err) => {
        const context = {
          isError: true,
          error: "wrong password",
          page: "user",
        };
        res.render("login", context);
      });
  }
});

app.post("/addData", async (req, res) => {
  const username = req.body.username;
  const name = req.body.name;

  delete req.body.name;
  delete req.body.username;

  user = getUserInfo(username);
  const dat = getData(username);
  let cnt = await getCount(username, user.docId);

  for (const key in req.body) {
    cnt = cnt + 1;
    data = {
      id: cnt,
      name: name,
      number: req.body[key],
      date_added: Timestamp.fromDate(new Date()),
    };
    insert(username, data);
  }

  updateConter(username, user.docId, cnt);

  const per = (await getData("persons"))[0]["name"];
  const allEntries = await getAllUserData(username);

  const context = {
    persons: per,
    username: username,
    entries: allEntries,
    showData: true,
  };

  res.render("users", context);
});

app.get("/getAllData", async (req, res) => {
  let startDate = new Date(req.query.startDate);
  let endDate = new Date(req.query.endDate);
  endDate.setDate(endDate.getDate() + 1);

  getAllData(startDate, endDate)
    .then((data) => {
      res.render("admin", {
        entries: data,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      });
    })
    .catch((err) => {
      context = {
        users: users,
        admin: admin,
      };

      res.render("index", context);
    });
});

app.post("/savePDF", async (req, res) => {
  const username = req.body.username;
  const directory = path.join(__dirname, "tmp");
  // const directory = "/tmp";
  const location = path.join(directory, `${username}.pdf`);

  const stream = fs.createWriteStream(location);
  const doc = new PDFDocument();
  doc.pipe(stream);
  const description = `This data belongs to ${username}`;
  doc.fontSize(27).text(description, 100, 100);

  const datum = await getAllUserData(username);

  for (const data of datum) {
    const text = `Id: ${data[0]}\nName: ${data[1]}\nNumber: ${data[2]}\nDate: ${data[3]}`;
    doc.addPage().fontSize(15).text(text, 100, 100);
  }

  doc.end();

  stream.on("finish", function () {
    res.send({ success: true, location: location });
  });
});

app.post("/getPDF", async (req, res) => {
  const PDFlocation = req.body.location;
  res.download(PDFlocation);
});


module.exports = app;
