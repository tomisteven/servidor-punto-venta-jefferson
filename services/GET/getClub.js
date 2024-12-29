const Club = require("../../models/Club");

const getClub = async (obj, select) => {
  return await Club.find(obj).select(select).lean();
};
