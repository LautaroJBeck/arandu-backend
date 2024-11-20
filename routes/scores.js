const { Router } = require("express");
const formatToISODate = require("../helpers/formatToISO");
const parseDate = require("../helpers/convertOnlyDate");
const ruta = Router();

// Obtener los puntos para la interfaz

ruta.get("/:id", (req, res) => {
  let { id } = req.params;

  req.getConnection((err, conn) => {
    if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
    conn.query("SELECT * from unidad where user_id=?", [id], (err, rows) => {
      if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
      const lista = {};
      let resultado = rows;

      let promises = [];
      for (let i = 0; i < resultado.length; i++) {
        promises.push(
          new Promise((resolve, reject) => {
            conn.query(
              "SELECT * FROM niveles where nivel_id=?",
              [resultado[i].nivel_id],
              (err, rows) => {
                if (err) {
                  reject(err);
                  return;
                }
                lista[resultado[i].nombre] = rows[0];
                resolve();
              }
            );
          })
        );
      }

      Promise.all(promises)
        .then(() => {
          return res.status(200).json(lista);
        })
        .catch((err) => {
          return res.status(500).json({error:"Error al obtener datos"});
        });
    });
  });
});
//Obtener puntaje para un NIVEL en particular
ruta.get("/:id/:nivel",(req,res)=>{
  let {id,nivel}=req.params
  req.getConnection((err,conn)=>{
    if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
    conn.query("SELECT * from unidad where user_id=?",[id],(err,rows)=>{
      if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })

      let nivelIdBuscado=rows.find(el=>el.nombre==nivel).nivel_id
      conn.query("SELECT * FROM niveles where nivel_id=?",nivelIdBuscado,(err,rows)=>{
        if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })

        return res.status(200).json({
          nivelesEjercicio:rows[0]
        })
      }) 
    })
  })
})

//Obtener puntaje para un ejercicio en particular
ruta.get("/:id/:nivel/:tipo",(req,res)=>{
  let {id,nivel,tipo}=req.params;
  req.getConnection((err, conn) => {
    if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
    conn.query("SELECT * from unidad where user_id=?", [id], (err, rows) => {
      if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
      let nivelIdBuscado=rows.find(el=>el.nombre==nivel).nivel_id
      conn.query("SELECT * FROM niveles where nivel_id=?",nivelIdBuscado,(err,rows)=>{
        if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
        return res.status(200).json({
          nivelEjercicio:rows[0][tipo],
          nivel_id:rows[0]["nivel_id"]
        })
        //res.status(200).json({nivel:rows[0][tipo]})
      })
    })
  })
})
// Cambiar puntaje para un ejercicio en particular

ruta.put("/:nivel_id/:tipo",(req,res)=>{
  let {nivel_id,tipo}=req.params
  let {nuevoPuntaje,user_id}=req.body
  req.getConnection((err,conn)=>{
    if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
    conn.query("UPDATE niveles set ?? = ? WHERE nivel_id=?",[tipo,nuevoPuntaje,parseInt(nivel_id)],(err,rows)=>{
      if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
      conn.query("SELECT * FROM ejercicios_ultima_fecha WHERE user_id=?",[user_id],(err,rows)=>{
        if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
        const paraguayanDate=new Date().toLocaleDateString('es-PY', {
            timeZone: 'America/Asuncion',
        });
        const today=formatToISODate(paraguayanDate)
        const fechaUltimoEjercicio=rows[0].fecha.toISOString().split('T')[0]
        if(fechaUltimoEjercicio!==today){
          //Primer ejercicio del dia
          conn.query("UPDATE ejercicios_ultima_fecha set ? WHERE user_id=?",[{fecha:today,cantidad:(nuevoPuntaje/25)},user_id],(err,rows)=>{
          if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
          
          if((nuevoPuntaje/25)>=12){
            conn.query(`SELECT * FROM rachas
            WHERE user_id = ?
            ORDER BY fecha_final DESC
            LIMIT 1;`,[user_id],(err,rows)=>{
              if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
              if(rows.length==0){
                conn.query("INSERT INTO rachas set ?",[{user_id,fecha_inicio:today,fecha_final:today}],(err,rows)=>{
                  if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                  return res.status(200).json({msg:"Los datos fueron actualizados exitosamente",racha:true})  
                })
              }else{
                const idRacha=rows[0].id
                const todayDate=parseDate(today)
                const fechaUltimaRacha=parseDate(rows[0].fecha_final)
                const diffTime=todayDate-fechaUltimaRacha
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if(diffDays>=2){
                  // Crear racha
                  conn.query("INSERT INTO rachas set ?",[{user_id,fecha_inicio:today,fecha_final:today}],(err,rows)=>{
                    if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                    return res.status(200).json({msg:"Felicidades! Empezaste una racha",racha:true,rachaCreada:true,})   
                  })
                }else if(diffDays==1){
                  //Actualizar racha
                  conn.query("UPDATE rachas set ? WHERE id=?",[{user_id,fecha_final:today},idRacha],(err,rows)=>{
                    if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                    return res.status(200).json({msg:"Felicidades! Extendiste tu racha",racha:true,rachaCreada:true})  
                  })
                }else{
                  //Solo suma puntos
                  return res.status(200).json({msg:"Los datos fueron actualizados exitosamente",racha:true}) 
                }
              }
            })
          }else{
            return res.status(200).json({msg:"Los datos fueron actualizados exitosamente",racha:false,cantidad:(nuevoPuntaje/25)})    
          }
          })
        }else{
          //Varios ejercicios en el dia
          let nuevaCantidad=rows[0].cantidad+(nuevoPuntaje/25)
          conn.query("UPDATE ejercicios_ultima_fecha set ? WHERE user_id=?",[{cantidad:nuevaCantidad},user_id],(err,rows)=>{
            if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            if(nuevaCantidad>=12){
              conn.query(`SELECT * FROM rachas
              WHERE user_id = ?
              ORDER BY fecha_final DESC
              LIMIT 1;`,[user_id],(err,rows)=>{
                if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                if(rows.length==0){
                  conn.query("INSERT INTO rachas set ?",[{user_id,fecha_inicio:today,fecha_final:today}],(err,rows)=>{
                    if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                    return res.status(200).json({msg:"Los datos fueron actualizados exitosamente",racha:true})  
                  })
                }else{
                  const idRacha=rows[0].id
                  const todayDate=parseDate(today)
                  const fechaUltimaRacha=parseDate(rows[0].fecha_final)
                  const diffTime=todayDate-fechaUltimaRacha
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                  if(diffDays>=2){
                    // Crear racha
                    conn.query("INSERT INTO rachas set ?",[{user_id,fecha_inicio:today,fecha_final:today}],(err,rows)=>{
                      if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                      return res.status(200).json({msg:"¡Felicidades! Empezaste una racha",racha:true,rachaCreada:true})    
                  })
                  }else if(diffDays==1){
                    //Actualizar racha
                    conn.query("UPDATE rachas set ? WHERE id=?",[{user_id,fecha_final:today},idRacha],(err,rows)=>{
                      if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                      return res.status(200).json({msg:"¡Felicidades! Extendiste tu racha",racha:true,rachaCreada:true}) 
                    })
                  }else{
                    //Solo suma puntos
                    return res.status(200).json({msg:"Los datos fueron actualizados exitosamente",racha:true}) 
                  }
                }
              })
            }else{
              return res.status(200).json({msg:"Los datos fueron actualizados exitosamente",racha:false,cantidad:(nuevoPuntaje/25)})    
            }
          })
        }
      })
    })
  })
})
module.exports = ruta;