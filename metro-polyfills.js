/**
 * Metro bundler polyfills configuration for React Native
 *
 * This module provides polyfills for Node.js core modules that don't exist
 * in React Native environments. These are necessary for WDK and crypto operations.
 */

/**
 * Returns polyfill mappings for Node.js core modules
 * @returns {object} Configuration object for Metro's extraNodeModules
 */
function getMetroPolyfills() {
  return {
    'stream': require.resolve('stream-browserify'),
    'buffer': require.resolve('@craftzdog/react-native-buffer'),
    'crypto': require.resolve('react-native-crypto'),
    'net': require.resolve('react-native-tcp-socket'),
    'tls': require.resolve('react-native-tcp-socket'),
    'url': require.resolve('react-native-url-polyfill'),
    'http': require.resolve('stream-http'),
    'https': require.resolve('https-browserify'),
    'http2': require.resolve('http2-wrapper'),
    'zlib': require.resolve('browserify-zlib'),
    'path': require.resolve('path-browserify'),
    'querystring': require.resolve('querystring-es3'),
    'events': require.resolve('events'),
    'nice-grpc': require.resolve('nice-grpc-web'),
    'sodium-universal': require.resolve('sodium-javascript'),
  };
}

/**
 * Configures Metro resolver with WDK polyfills and resolveRequest handler
 * This is the recommended way to configure Metro for apps using wdk-react-native-provider
 *
 * @param {object} config - Base Metro config (from getDefaultConfig)
 * @returns {object} Modified Metro config with WDK polyfills
 *
 * @example
 * const { getDefaultConfig } = require('expo/metro-config');
 * const { configureMetroForWDK } = require('@tetherto/wdk-react-native-provider/metro-polyfills');
 *
 * const config = getDefaultConfig(__dirname);
 * module.exports = configureMetroForWDK(config);
 */
function configureMetroForWDK(config) {
  const polyfills = getMetroPolyfills();

  // Save the existing resolveRequest BEFORE replacing config.resolver
  const existingResolveRequest = config.resolver.resolveRequest;

  config.resolver = {
    ...config.resolver,
    extraNodeModules: {
      ...config.resolver.extraNodeModules,
      ...polyfills,
    },
    resolveRequest: (context, moduleName, platform) => {
      // Handle polyfills that need special resolution
      if (moduleName === 'stream') {
        return {
          filePath: require.resolve('stream-browserify'),
          type: 'sourceFile',
        };
      } else if (moduleName === 'url') {
        return {
          filePath: require.resolve('react-native-url-polyfill'),
          type: 'sourceFile',
        };
      }

      // Use existing resolveRequest if available, otherwise use default
      if (
        existingResolveRequest &&
        existingResolveRequest !== arguments.callee
      ) {
        return existingResolveRequest(context, moduleName, platform);
      }

      return context.resolveRequest(context, moduleName, platform);
    },
  };

  return config;
}

module.exports = getMetroPolyfills;
module.exports.getMetroPolyfills = getMetroPolyfills;
module.exports.configureMetroForWDK = configureMetroForWDK;
