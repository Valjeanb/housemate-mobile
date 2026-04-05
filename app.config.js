// Extends app.json with additional config not editable directly
const base = require("./app.json");

module.exports = {
  ...base.expo,
  android: {
    ...base.expo.android,
    package: "com.vibecode.sitterhub",
  },
  ios: {
    ...base.expo.ios,
    infoPlist: {
      ...base.expo.ios?.infoPlist,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
};
