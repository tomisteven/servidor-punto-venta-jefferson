const Bug = require("../../models/Bug");
const nodemailer = require("nodemailer");
const fs = require("fs");

const createBug = async (error, funcion) => {
  try {
    const bug = new Bug();

    bug.funcion = funcion;
    bug.error = error;

    bug.save();

    const bugs = await Bug.find();
    const html = fs.readFileSync("./email.html", "utf8");
    const replacedHTML = html
      .replace("{{ bug.estado }}", bug.estado)
      .replace("{{ bug._id }}", bug._id)
      .replace("{{ bug.fecha }}", bug.fecha)
      .replace("{{ bug.funcion }}", bug.funcion)
      .replace("{{ bug.error }}", bug.error);

    const transporter = nodemailer.createTransport({
      service: "gmail" || "Gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "factosdev@gmail.com",
        pass: process.env.pass_gmail,
      },
    });

    // Definir el contenido del correo electrónico
    let mailOptions = {
      from: "factosdev@gmail.com",
      to: "totosteven65@gmail.com",
      subject: "Nuevo BUG",
      html: replacedHTML,
    };

    // Enviar el correo electrónico
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        // Aquí no tienes acceso a `res` para responder con el estado HTTP, tendrías que manejar este caso de error de otra manera
      } else {
        console.log("Correo electrónico enviado: " + info.response);
        // Aquí tampoco tienes acceso a `res` para responder con el estado HTTP
      }
    });

    console.log("Email del bug enviado correctmente");
  } catch (error) {
    console.log(error);
  }
};

const getBugs = async (req, res) => {
  try {
    const bugs = await Bug.find();
    res.status(200).json(bugs);
  } catch (error) {
    await createBug(error, "getBugs");
    console.log(error);
  }
};

const getBug = async (req, res) => {
  try {
    const { id } = req.params;

    const bug = await Bug.findById(id);

    res.status(200).json(bug);
  } catch (error) {
    await createBug(error, "getBug/:id");
  }
};

const changeStateBug = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.query;
    const bug = await Bug.findById(id);

    console.log(estado);

    bug.estado = estado;

    bug.save();

    console.log(bug);

    res.status(200).json(bug);
  } catch (error) {
    await createBug(error, "changeStateBug");
    res.status(500).json("Error al cambiar estado del bug");
  }
};

module.exports = {
  createBug,
  getBugs,
  changeStateBug,
  getBug,
};
