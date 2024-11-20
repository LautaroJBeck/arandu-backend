const {Router} =require("express");
const parseDate = require("../helpers/convertOnlyDate");
const formatToISODate = require("../helpers/formatToISO");
const getDatesInRange = require("../helpers/getDatesInRange");

const ruta=Router();
// Para mostrar calendario y racha (largo)
    /*
    {
    historialRachas,
    longitudRacha,
    racha:true/false
    }
    */
ruta.get("/largo/:user_id",(req,res)=>{

    const {user_id}=req.params
    const paraguayanDate=new Date().toLocaleDateString('es-PY', {
        timeZone: 'America/Asuncion',
    });
    const today=formatToISODate(paraguayanDate)
    const queryHistorialRachas=`
    SELECT fecha_inicio, fecha_final
    FROM rachas
    WHERE fecha_inicio >= DATE_SUB("${today}", INTERVAL 1 YEAR)
    AND user_id = ?;
    `;
    const queryUltimaRacha=`
    SELECT *
    FROM rachas
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 1;
    `
    req.getConnection((err, conn) => {
        if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
        conn.query(queryHistorialRachas,[user_id],(req,rows)=>{
            if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            let listaFechas=[]
            for(let i=0;i<rows.length;i++){
                listaFechas.push(...getDatesInRange(rows[i].fecha_inicio,rows[i].fecha_final))
            }
            listaFechas=Array.from(new Set(listaFechas))
            conn.query(queryUltimaRacha,[user_id],(req,rows)=>{
                if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                if(rows[0]){
                    const fechaPrincipioRacha=parseDate(rows[0].fecha_inicio)
                    const fechaFinalRacha=parseDate(rows[0].fecha_final)
                    const diffTime=fechaFinalRacha-fechaPrincipioRacha
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))+1;
                    let resultadoUltimaRacha=rows
                    return res.status(200).json({listaFechas,resultadoUltimaRacha,duracionRacha:diffDays})
                }else{
                    return res.status(200).json({listaFechas:[],resultadoUltimaRacha:[],duracionRacha:0})
                }
            })
        })
    })
})
ruta.get("/corto/:user_id",(req,res)=>{
    const {user_id}=req.params
    const diaDeLaSemana = new Date().toLocaleString('en-US', {timeZone: 'America/Asuncion', weekday: 'long' })
    const paraguayanDate=new Date().toLocaleDateString('es-PY', {
        timeZone: 'America/Asuncion',
    });
    const today=formatToISODate(paraguayanDate)
    const valoresDiaDeLaSemana={
        Sunday:0,
        Monday:1,
        Tuesday:2,
        Wednesday:3,
        Thursday:4,
        Friday:5,
        Saturday:6
    }
    const querySemana=`
    SELECT fecha_inicio, fecha_final
    FROM rachas
    WHERE user_id = ${user_id}
    AND DATEDIFF("${today}", fecha_inicio) <= ${7}
    `
    req.getConnection((err,conn)=>{
        conn.query(querySemana,[],(req,rows)=>{
            let listaFechas=[]
            let diffDays
            for(let i=0;i<rows.length;i++){
                listaFechas.push(...getDatesInRange(rows[i].fecha_inicio,rows[i].fecha_final))
                if(i==rows.length-1){
                    let fechaPrincipioRacha=parseDate(rows[i].fecha_inicio)
                    let fechaFinalRacha=parseDate(rows[i].fecha_final)
                    let diffTime=fechaFinalRacha-fechaPrincipioRacha
                    //Se suma +1 porque se esta calculando la longitud de las rachas
                    diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))+1;
                    let todayDate=parseDate(today)
                    let diffTimeRacha=todayDate-fechaFinalRacha
                    //No se suma +1 porque se esta calculando el tiempo distante etnre la ultima racha
                    let finalDiffTime=Math.floor(diffTimeRacha / (1000 * 60 * 60 * 24));
                    if(finalDiffTime>=2){
                        diffDays=0
                    }
                }
            }
            listaFechas=Array.from(new Set(listaFechas))
            conn.query("SELECT * FROM ejercicios_ultima_fecha WHERE user_id=?",[user_id],(err,rows)=>{ 
                const paraguayanDate=new Date().toLocaleDateString('es-PY', {
                    timeZone: 'America/Asuncion',
                });
                const today=formatToISODate(paraguayanDate)
                let cantidadEjerciciosHoy=
                rows[0].fecha.toISOString().split('T')[0]==today?
                rows[0].cantidad:0;
                return res.status(200).json({
                    diaDeLaSemana,
                    listaFechas,
                    duracionRacha:diffDays,
                    cantidadEjerciciosHoy
                })
            })
        })
    })
})

// Para mostrar semana y racha (corto)
module.exports=ruta