const Club = require("../../models/Club");

const getClubesByFilters = async (obj = {}, strings) => {
  return await Club.find(obj, strings).lean();
};

module.exports = { getClubesByFilters };
