const express = require("express");
const users = require("./public/json/users.json");
const admin = require("./public/json/admin.json");
const { Timestamp } = require("firebase/firestore");

const edgeChromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

const path = require("path");
const url = require("url");
const PORT = 4000;

const app = express();

const { insert, getData, signInUser, getAllData } = require("./database");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "tmp")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

function fullUrl(req) {
  return url.format({
    protocol: req.protocol,
    host: req.get("host"),
  });
}

const downloadPdf = async (host, startDate, endDate) => {
  const executablePath = await edgeChromium.executablePath;

  const browser = await puppeteer.launch({
    executablePath,
    args: edgeChromium.args,
    headless: false,
  });

  // const browser = await puppeteer.launch();

  const page = await browser.newPage();
  let website_url = `${host}/getPDF`;
  if (startDate != "")
    website_url = `${host}/getPDF?startDate=${startDate}&endDate=${endDate}`;

  await page.goto(website_url, { waitUntil: "networkidle0" });
  await page.emulateMediaType("screen");
  const pdf = await page.pdf({
    path: "./tmp/result.pdf",
    margin: { top: "100px", right: "50px", bottom: "100px", left: "50px" },
    printBackground: true,
    format: "A4",
  });
  await browser.close();
};

app.get("/", (req, res) => {
  context = {
    users: users,
    admin: admin,
  };

  res.render("index", context);
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
            res.render("admin", { email: email, entries: data });
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

  users.forEach((user) => {
    if (user["email"] == email) flag = true;
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

    signInUser(email, password)
      .then((userdata) => {
        const context = {
          email: email,
          persons: per,
          showData: false,
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
  const email = req.body.email;
  const name = req.body.name;
  let numbers = [];
  delete req.body.email;
  delete req.body.name;

  for (const key in req.body) numbers.push(req.body[key]);

  data = {
    name: name,
    numbers: numbers,
    date_added: Timestamp.fromDate(new Date()),
  };

  insert(email, data);
  const per = (await getData("persons"))[0]["name"];

  // getting all all feed
  let allEntries = new Array();

  const entries = await getData(email);
  let cnt = 10001;

  entries.forEach((mp) => {
    mp["numbers"].forEach((num) => {
      let helper = new Array();
      helper.push(cnt);
      helper.push(mp["name"]);
      helper.push(num);
      helper.push(mp["date_added"].toDate());
      cnt = cnt + 1;
      allEntries.push(helper);
    });
  });

  allEntries.sort((a, b) => {
    return a[3] - b[3];
  });

  const context = {
    email: email,
    persons: per,
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
      res.render("admin", { entries: data });
    })
    .catch((err) => {
      context = {
        users: users,
        admin: admin,
      };

      res.render("index", context);
    });
});

app.get("/downloadPdf", (req, res) => {
  let startDate = "";
  let endDate = "";
  if (req.query.startDate) startDate = req.query.startDate;
  if (req.query.endDate) {
    endDate = req.query.endDate;
  }
  downloadPdf(fullUrl(req), startDate, endDate).then(() => {
    res.download("tmp/result.pdf");
  });
});

app.get("/getPDF", async (req, res) => {
  let startDate = "";
  let endDate = "";
  if (req.query.startDate) startDate = new Date(req.query.startDate);
  if (req.query.endDate) {
    endDate = new Date(req.query.endDate);
    endDate.setDate(endDate.getDate() + 1);
  }

  getAllData(startDate, endDate)
    .then((data) => {
      // downloadPdf(startDate,endDate);
      res.render("pdfData", { entries: data });
    })
    .catch((err) => {
      context = {
        users: users,
        admin: admin,
      };

      res.render("index", context);
    });
});

app.listen(PORT);
module.exports = app;
