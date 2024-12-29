const Bug = require("../models/Bug");

const createBug = async (error, location) => {
  try {
    const newBug = new Bug({
      error,
      location,
    });

    await newBug.save();
  } catch (error) {
    console.error("Error en createBug:", error);
  }
};

module.exports = { createBug };
