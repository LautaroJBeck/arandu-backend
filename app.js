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
app.use(myconn(mysql, dbOptions, 'single'));
app.use(cors());
app.use(express.json());

let connectionPool; // Variable para almacenar la conexión

// Configura la conexión para poder usarla en el ping
app.use((req, res, next) => {
  req.getConnection((err, connection) => {
    if (err) {
      return next(err);
    }
    connectionPool = connection; // Guarda la conexión en la variable
    next();
  });
});

// Función para hacer ping a la base de datos
function pingDatabase() {
  if (connectionPool) {
    connectionPool.ping((err) => {
      if (err) {
        console.error('Error al hacer ping a la base de datos:', err);
      } else {
        console.log('Ping a la base de datos exitoso.');
      }
    });
  } else {
    console.log('No se pudo hacer ping: no hay conexión activa.');
  }
}

// Ejecuta el ping cada 6000 milisegundos (6 segundos)
setInterval(pingDatabase, 60000);

// Rutas de la API
app.use("/api/examen", require("./routes/examen"));
app.use("/api/preguntas", require("./routes/preguntas"));
app.use("/api/register", require("./routes/register"));
app.use("/api/login", require("./routes/login"));
app.use("/api/scores", require("./routes/scores"));

module.exports = app;
