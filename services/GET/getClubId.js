const Club = require("../../models/Club");

const getClubId = async (id, session) => {
  console.log("Peticion desde Services");

  return await Club.findById(id).session(session);
};

module.exports = { getClubId };
