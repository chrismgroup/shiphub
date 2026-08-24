const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// pnpm can briefly create and remove `_tmp_` package directories while
// installing or reconciling the shared workspace. Metro otherwise discovers
// those paths through the workspace node_modules tree and crashes when the
// watcher reaches one after it has disappeared.
config.resolver.blockList = [
  /node_modules[\\/]\.pnpm[\\/].*_tmp[^\\/]*[\\/].*/,
];

module.exports = config;
