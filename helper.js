const users = require("./public/json/users.json");

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

module.exports = {
  getUserInfo,
};
