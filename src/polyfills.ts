// Polyfills for browser compatibility with Node.js globals
// This file MUST be imported as the very first line in src/index.tsx

// Synchronous import of Buffer at the top
import { Buffer } from 'buffer';

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

  // Ensure Buffer is available globally
  if (typeof (window as any).Buffer === 'undefined') {
    (window as any).Buffer = Buffer;
    console.log('Buffer polyfill loaded successfully');
  }
}
