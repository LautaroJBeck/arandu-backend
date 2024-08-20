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

// Configura la conexión para poder usarla en la consulta
app.use((req, res, next) => {
  req.getConnection((err, connection) => {
    if (err) {
      return next(err);
    }
    connectionPool = connection; // Guarda la conexión en la variable
    next();
  });
});

// Función para ejecutar la consulta "SELECT 1"
function queryDatabase() {
  if (connectionPool) {
    connectionPool.query('SELECT * FROM user where id=2', (err, results) => {
      if (err) {
        console.error('Error al ejecutar la consulta "SELECT 1":', err);
      } else {
        console.log('Consulta "SELECT 1" ejecutada exitosamente:', results);
      }
    });
  } else {
    console.log('No se pudo ejecutar la consulta: no hay conexión activa.');
  }
}

// Ejecuta la consulta cada 60000 milisegundos (60 segundos)
setInterval(queryDatabase, 60000);

// Rutas de la API
app.use("/api/examen", require("./routes/examen"));
app.use("/api/preguntas", require("./routes/preguntas"));
app.use("/api/register", require("./routes/register"));
app.use("/api/login", require("./routes/login"));
app.use("/api/scores", require("./routes/scores"));

module.exports = app;
