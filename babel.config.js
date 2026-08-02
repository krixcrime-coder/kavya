module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // MUST stay last in the plugins array — reanimated requirement
      "react-native-reanimated/plugin",
    ],
  };
};
