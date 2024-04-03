export default {
  moduleNameMapper: {
    "^@app/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  verbose: true,
  coverageDirectory: "./coverage/",
  collectCoverage: true,
};
