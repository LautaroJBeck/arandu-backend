// Importaciones
require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const myconn = require("express-myconnection");
const cors = require("cors");

const app = express();

app.set("PORT", process.env.PORT || 8080);

const dbOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE
};

// Middleware de conexión a la base de datos y configuración
app.use(myconn(mysql, dbOptions, 'pool'));
app.use(cors());
app.use(express.json());

// Rutas de la API
app.use("/api/examen", require("./routes/examen"));
app.use("/api/preguntas", require("./routes/preguntas"));
app.use("/api/register", require("./routes/register"));
app.use("/api/login", require("./routes/login"));
app.use("/api/scores", require("./routes/scores"));
app.use("/api/relaciones",require("./routes/solicitudProfesor"))
module.exports = app;
