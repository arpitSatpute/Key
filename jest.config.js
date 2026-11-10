module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|lucide-react-native)/)',
  ],
  setupFiles: ['./jest.setup.js'],
};
