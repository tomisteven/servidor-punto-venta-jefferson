const Club = require("../../models/Club");

const getClubByFilter = async (id, filtro = {}, strings) => {
  console.log("Peticion desde Services");

  return await Club.findById(id, filtro, strings).lean();
};

module.exports = { getClubByFilter };
