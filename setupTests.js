import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import "@testing-library/jest-dom";
import "whatwg-fetch";

globalThis.importMetaEnv = {
  VITE_APP_API_URL: "http://127.0.0.1:8000/api", // Ajusta con la URL real
};
process.env.VITE_APP_API_URL = "http://localhost:3000";

class MockBroadcastChannel {
  constructor() {}
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}

global.BroadcastChannel = MockBroadcastChannel;
