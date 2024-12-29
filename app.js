const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const cookieParser = require("cookie-parser");

const apiClientes = require("./Routes/clientes.routes");
const apiCuentas = require("./Routes/cuentas.routes");
const apiServicios = require("./Routes/servicios.routes");
const apiBancos = require("./Routes/bancos.routes");
const apiCompras = require("./Routes/compras.routes");
const api = require("./Routes/api.routes");

const app = express();
const dotenv = require("dotenv");
const { createBug } = require("./controllers/POST/bug.controller");

dotenv.config();

// Settings
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

app.use(express.static(__dirname + "/uploads"));

// Routes
app.use("/clientes", apiClientes);
app.use("/cuenta", apiCuentas);
app.use("/servicios", apiServicios);
app.use("/bancos", apiBancos);
app.use("/compras", apiCompras);
app.use("/api/v1", api);

module.exports = app;
