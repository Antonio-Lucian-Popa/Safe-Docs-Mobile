module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // înlocuiește 'react-native-reanimated/plugin' cu:
      'react-native-worklets/plugin',
      'expo-router/babel',
    ],
  };
};
