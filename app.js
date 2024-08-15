//Importaciones
require("dotenv").config()
const express=require("express");
const mysql=require("mysql2");
const myconn=require("express-myconnection");

const cors=require("cors");
const app=express();

app.set("PORT",process.env.PORT || 8080)

const dbOptions={
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    port:process.env.DB_PORT,
    database:process.env.DB_DATABASE
}

app.use(myconn(mysql,dbOptions,`single`))
app.use(cors())
app.use(express.json())

// Mantener viva la conexión enviando una consulta ligera cada 2 horas
setInterval(() => {
    app.use((req, res, next) => {
        req.getConnection((err, connection) => {
            if (err) return next(err);
            connection.query('SELECT 1', (err) => {
                if (err) console.log('Error keeping connection alive:', err);
            });
        });
        next();
    });
},  1800000); // 1800000 ms = 30 minutos

app.use("/api/examen",require("./routes/examen"))
app.use("/api/preguntas",require("./routes/preguntas"))
app.use("/api/register",require("./routes/register"))
app.use("/api/login",require("./routes/login"))
app.use("/api/scores",require("./routes/scores"))


module.exports=app;