module.exports = {
  testEnvironment:"jsdom",
  setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
  
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  }
};
