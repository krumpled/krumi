/* eslint-env node */
module.exports = {
  preset: 'ts-jest',
  moduleNameMapper: {
    '^@krumpled/krumi/(.*)$': '<rootDir>/src/$1',
  },
};
