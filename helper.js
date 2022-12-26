const url = require("url");
const users = require("./public/json/users.json");

function fullUrl(req) {
  return url.format({
    protocol: req.protocol,
    host: req.get("host"),
  });
}

function getUserInfo(username) {
  let userInfo = {};

  users.forEach((user) => {
    if (user["username"] == username) {
      userInfo = user;
      return;
    }
  });

  return userInfo;
}

function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

module.exports = {
  fullUrl,
  getUserInfo,
  makeid,
};
