// Extends app.json with additional config not editable directly
const base = require("./app.json");

module.exports = {
  ...base.expo,
  // SDK 54: expo install --fix requires these config plugins for native builds
  // (no effect in Expo Go). Couldn't be auto-written into app.json (dynamic config).
  plugins: [
    ...(base.expo.plugins ?? []),
    "@react-native-community/datetimepicker",
    "expo-asset",
    "expo-build-properties",
    "expo-font",
    "expo-mail-composer",
    "expo-secure-store",
    "expo-sqlite",
    "expo-video",
    "expo-web-browser",
  ],
  android: {
    ...base.expo.android,
    package: "com.vibecode.sitterhub",
  },
  ios: {
    ...base.expo.ios,
    buildNumber: "4",
    infoPlist: {
      ...base.expo.ios?.infoPlist,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
};
