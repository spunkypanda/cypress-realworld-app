// const cypressTypeScriptPreprocessor = require("./cy-ts-preprocessor");
// eslint-disable-next-line no-native-reassign
require = require("esm")(module); // eslint-disable-line no-global-assign

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
const { find, filter } = require("lodash/fp");
const axios = require("axios").default;
const awsConfig = require("../../src/aws-exports").default;

require("dotenv").config();

module.exports = (on, config) => {
  config.env.defaultPassword = process.env.SEED_DEFAULT_USER_PASSWORD;
  config.env.paginationPageSize = process.env.PAGINATION_PAGE_SIZE;
  config.env.mobileViewportWidth = process.env.MOBILE_VIEWPORT_WIDTH;
  config.env.awsUserPoolsId = awsConfig.aws_user_pools_id;

  // on("file:preprocessor", cypressTypeScriptPreprocessor);
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  on("task", {
    "db:seed"() {
      // seed database with test data
      return axios
        .post(`http://localhost:3001/testData/seed`)
        .then((resp) => resp.data);
    },
    // fetch test data from a database (MySQL, PostgreSQL, etc...)
    "filter:testData"({ entity, filterAttrs }) {
      return axios
        .get(`http://localhost:3001/testData/${entity}`)
        .then(({ data }) => filter(filterAttrs, data.results));
    },
    "find:testData"({ entity, findAttrs }) {
      return axios
        .get(`http://localhost:3001/testData/${entity}`)
        .then(({ data }) => find(findAttrs, data.results));
    },
  });

  // require("@cypress/code-coverage/task")(on, config);
  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config;
};
