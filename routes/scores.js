const { Router } = require("express");
const ruta = Router();

// Obtener los puntos para la interfaz
ruta.get("/:id", (req, res) => {
  let { id } = req.params;

  req.getConnection((err, conn) => {
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
  let {nuevoPuntaje}=req.body
  req.getConnection((err,conn)=>{
    if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
      conn.query("UPDATE niveles set ?? = ? WHERE nivel_id=?",[tipo,nuevoPuntaje,parseInt(nivel_id)],(err,rows)=>{
          if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
          return res.status(200).json({msg:"Los datos fueron actualizados exitosamente"})
      })
  })
})
module.exports = ruta;
