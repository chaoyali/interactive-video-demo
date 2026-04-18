// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the monorepo root so Metro picks up changes outside app/ (e.g. videos/, shared/).
config.watchFolders = [workspaceRoot];

// 2. Resolve node_modules from the app first, then fall back to the hoisted root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Prevent Metro from walking up the directory tree and picking up stray installs.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
