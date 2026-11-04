// Lives the four daymates off the main thread (about half a second of simulation).
import { liveDaymates } from './daymates.js';
self.onmessage = ({ data }) => {
  try {
    self.postMessage({ key: data.key, lives: liveDaymates(data.seed, data.birthDate) });
  } catch (e) {
    self.postMessage({ key: data.key, error: String(e) });
  }
};
