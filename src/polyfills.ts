/**
 * Polyfills for React Native environment
 * This file sets up necessary polyfills for cryptographic and stream operations
 * that are required by the WDK library and related crypto packages.
 */

import { Buffer } from '@craftzdog/react-native-buffer';
import 'react-native-get-random-values';

// Set up Buffer polyfill
if (typeof global.Buffer === 'undefined') {
  // @ts-ignore
  global.Buffer = Buffer;
}

// Set up process polyfill for stream operations
if (typeof global.process === 'undefined') {
  // @ts-ignore
  global.process = require('process');
}

// Initialize crypto polyfill after Buffer and process are available
if (typeof global.crypto === 'undefined') {
  try {
    const crypto = require('react-native-crypto');
    // @ts-ignore
    global.crypto = crypto;
  } catch (e) {
    console.warn('Failed to load crypto polyfill:', e);
  }
}
