// Extends app.json with additional config not editable directly
const base = require("./app.json");

module.exports = {
  ...base.expo,
  android: {
    ...base.expo.android,
    package: "com.vibecode.sitterhub",
  },
};
