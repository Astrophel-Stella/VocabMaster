/**
 * Vitest setup file - Mock browser APIs for jsdom environment
 */

// Mock HTMLMediaElement for audio tests
class MockHTMLMediaElement {
  src = '';
  paused = true;
  currentTime = 0;

  load() {}
  play() { return Promise.resolve(); }
  pause() {}
  addEventListener() {}
  removeEventListener() {}
  oncanplaythrough: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
}

globalThis.HTMLMediaElement = MockHTMLMediaElement as any;
globalThis.Audio = MockHTMLMediaElement as any;

// Mock URL.createObjectURL and revokeObjectURL
const originalURL = globalThis.URL;
globalThis.URL = class URL extends originalURL {
  static createObjectURL() {
    return 'blob:mock-url';
  }
  static revokeObjectURL() {}
} as any;
