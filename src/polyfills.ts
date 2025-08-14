// Polyfills for browser compatibility with Node.js globals
// This file MUST be imported as the very first line in src/index.tsx

if (typeof window !== 'undefined') {
  // Ensure 'global' is defined and points to 'window' for Node.js compatibility
  if (typeof (window as any).global === 'undefined' || (window as any).global === null) {
    (window as any).global = window;
  }

  // Polyfill BigInt.toJSON for serialization if not already present
  if (typeof BigInt !== 'undefined' && !(BigInt.prototype as any).toJSON) {
    (BigInt.prototype as any).toJSON = function() {
      return this.toString();
    };
  }

  // Additional polyfills for MultiversX SDK compatibility
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
  }

  // Ensure Buffer is available globally if needed
  if (typeof (window as any).Buffer === 'undefined') {
    try {
      // Synchronous import of Buffer
      // Note: must be at top-level if using ES modules
      import { Buffer } from 'buffer';
      (window as any).Buffer = Buffer;
      console.log('Buffer polyfill loaded successfully');
    } catch (e) {
      console.warn('Buffer polyfill not available - this is expected in some environments');
    }
  }
}
