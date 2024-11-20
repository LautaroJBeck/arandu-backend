const { Router } = require("express");
const { check } = require("express-validator");
const { validarCampos } = require("../helpers/validarCampos");

const bcryptjs = require("bcryptjs");
const generarJWT = require("../helpers/generarJWT");
const { actualizarConCorreo, actualizarSinCorreo } = require("../controllers/actualizarUsuario");
const formatToISODate = require("../helpers/formatToISO");
const ruta = Router();

//Registrarse
ruta.post(
  "/",
  [
    check("nombre", "No introdujiste el nombre").not().isEmpty(),
    check("apellido", "No introdujiste el apellido").not().isEmpty(),
    check("password", "No introdujiste la contraseña").not().isEmpty(),
    check("correo", "No introdujiste el correo").not().isEmpty(),
    check("rol","No introdujiste como quieres registrarte").not().isEmpty(),
    validarCampos,
  ],
  (req, res) => {
    let { nombre, apellido, password, correo,rol } = req.body;
    const salt = bcryptjs.genSaltSync();
    let passwordEncrypted = bcryptjs.hashSync(password, salt);
    password = passwordEncrypted;
    
    try {
      req.getConnection((err, conn) => {
        if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
        //Primera petición, busca si existe una cuenta con este correo
        conn.query("SELECT correo FROM user WHERE correo=?",[correo],(err, rows) => {
          if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
          //En el caso de que si, devuelve un mensaje que dice que el correo esta usado
          if (rows.length > 0) return res.status(404).json({ errors: ["Este correo ya está usado"] })
            
          let expRegular=/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g
    
          if(!expRegular.test(correo)) return res.status(404).json({errors:["El correo introducido no es válido"]})
          conn.query("INSERT into user set ?",[{ nombre, apellido,rol, password, correo }],(err, rows) => {
            if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            conn.query("SELECT * FROM user WHERE correo=? AND password=?",[correo,password],async (err, rows) => {      //Busca el ID de este usuario
              if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
              const { id, nombre, apellido, rol,correo } = rows[0];
              const token = await generarJWT(id,nombre,apellido,correo,rol);
              //A través del id, creo los puntajes del usuario
              ["basico","medio","avanzado"].forEach(el=>{
                let user_id=id;
                let nombre=el;
                conn.query("INSERT into unidad set ?",[{user_id,nombre}],(err,rows)=>{
                  if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                })
              })
              let arrayIds=[]
              const paraguayanDate= new Date().toLocaleDateString('es-PY', {
                timeZone: 'America/Asuncion',
              });
              const today=formatToISODate(paraguayanDate)
              conn.query("INSERT into ejercicios_ultima_fecha set ?",[{user_id:id,fecha:today,cantidad:0}],(err,rows)=>{
                //Se consiguen los IDs asignados dentro de la tabla nivel_id
                conn.query("SELECT * FROM unidad WHERE user_id=?",[id],async(err,rows)=>{
                  if(err) return res.send(err)
                  for(let i=0;i<rows.length;i++){
                    arrayIds.push(rows[i].nivel_id)
                  }
                  for(let i=0;i<rows.length;i++){
                    conn.query("INSERT into niveles set ?",[{
                      nivel_id:arrayIds[i],
                      contexto:0,
                      significado:0,
                      central:0,
                      conexiones:0,
                      estructura:0,
                      inferencias:0,
                      textuales:0
                    }],(err,rows)=>{
                      if(err) return res.status(500).json({ error: "Error al agregar datos a la base de datos." })
                    })
                  }
                })
              })
              return res.json({
              token,
              error: null
              });
            }
            );
          }); 
        });

          }
        );

    } catch (error) {
      return res.status(400).json(error);
    }
  }
);
//Obtener token cuando el usuario si esta registrado
ruta.post("/token/:id",async(req,res)=>{
  try{
    let {correo,nombre,apellido,rol}=req.body
    let {id}=req.params
    const token=await generarJWT(id,nombre,apellido,correo,rol)
    return res.status(200).json({
        token,error:null
    })
  }catch(err){
    return res.status(500).json({ error: "Error al obtener el token." })
  }

})
//Borrar cuenta
ruta.delete("/:id", [
  check("password", "No introdujiste la contraseña").not().isEmpty(),
  validarCampos
], (req, res) => {
  try {
    let { id } = req.params;
    let { password } = req.body;

    req.getConnection((err, conn) => {
      if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." });

      // Verificar que el usuario existe y obtener su contraseña
      conn.query("SELECT * FROM user WHERE id=?", [id], (err, userRows) => {
        if (err) return res.status(500).json({ error: "Error al consultar el usuario en la base de datos." });
        if (userRows.length === 0) {
          return res.status(404).json({ errors: ["Usuario no encontrado"] });
        }

        let validPassword = bcryptjs.compareSync(password, userRows[0].password);
        if (!validPassword) {
          return res.status(400).json({
            errors: ["No introdujiste tu contraseña correctamente"]
          });
        }

        // Eliminar registros en tablas relacionadas antes de eliminar en `examen`
        conn.query("DELETE FROM puntajes_unidad WHERE id_examen IN (SELECT examen_id FROM examen WHERE user_id=?)", [id], (err) => {
          if (err) return res.status(500).json({ error: "Error al eliminar puntajes asociados en unidad." });

          conn.query("DELETE FROM puntajes_general WHERE id_examen IN (SELECT examen_id FROM examen WHERE user_id=?)", [id], (err) => {
            if (err) return res.status(500).json({ error: "Error al eliminar puntajes generales asociados." });

            conn.query("DELETE FROM examen WHERE user_id=?", [id], (err) => {
              if (err) return res.status(500).json({ error: "Error al eliminar exámenes asociados." });

              conn.query("DELETE FROM niveles WHERE nivel_id IN (SELECT nivel_id FROM unidad WHERE user_id=?)", [id], (err) => {
                if (err) return res.status(500).json({ error: "Error al eliminar niveles asociados." });

                conn.query("DELETE FROM unidad WHERE user_id=?", [id], (err) => {
                  if (err) return res.status(500).json({ error: "Error al eliminar unidades asociadas." });

                  conn.query("DELETE FROM rachas WHERE user_id=?",[id],(err)=>{
                    if(err) return res.status(500).json({error:"Error al eliminar rachas asociadas."})
                      
                      conn.query("DELETE FROM ejercicios_ultima_fecha WHERE user_id=?",[id],(err)=>{
                        if(err) return res.status(500).json({error:"Error al eliminar rachas asociadas."})

                        conn.query("DELETE FROM solicitud_pendiente WHERE profesor_id=? OR correo_alumno IN (SELECT correo FROM user WHERE id=?)", [id, id], (err) => {
                          if (err) return res.status(500).json({ error: "Error al eliminar solicitudes pendientes asociadas." });
      
                          conn.query("DELETE FROM relaciones WHERE profesor_id=? OR alumno_id=?", [id, id], (err) => {
                            if (err) return res.status(500).json({ error: "Error al eliminar relaciones asociadas." });
      
                            // Finalmente eliminar el usuario
                            conn.query("DELETE FROM user WHERE id=?", [id], (err) => {
                              if (err) return res.status(500).json({ error: "Error al eliminar el usuario." });
                              return res.status(200).json({ msg: "El usuario se eliminó correctamente" });
                            });
                          });
                        });
                      })
                  })
                });
              });
            });
          });
        });
      });
    });
  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});




//Cambiar contraseña
ruta.put("/password/:id",[
  check("password","No introdujiste la contraseña").not().isEmpty(),
  check("newPassword","No introdujiste la nueva contraseña ").not().isEmpty(),
  validarCampos
],(req,res)=>{
  try {
    let {id}=req.params
    let {password,newPassword}=req.body
    req.getConnection((err,conn)=>{
      if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
      conn.query("SELECT * FROM user WHERE id=?",[id],(err,rows)=>{
        if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
          
        let validPassword=bcryptjs.compareSync(password,rows[0].password);
        if(!validPassword){
            return res.status(400).json({
                errors:["No introdujiste tu contraseña correctamente"]
            })
        }
        const salt = bcryptjs.genSaltSync();
        let passwordEncrypted = bcryptjs.hashSync(newPassword, salt);
        conn.query("UPDATE user set ? WHERE id=?",[{password:passwordEncrypted},id],(err,rows)=>{
          if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
          return res.status(200).json({msg:"La contraseña se actualizó exitosamente"})
        })
      })
    })
  } catch (error) {
    return res.status(500).json({ error: "Error al conectar con la base de datos." })
  }
})





//Editar datos (nombre,apellido y correo)
ruta.put("/:id", [
  check("nombre", "No introdujiste el nombre").not().isEmpty(),
  check("apellido", "No introdujiste el apellido").not().isEmpty(),
  check("correo", "No introdujiste el correo").not().isEmpty(),
  validarCampos,
], (req, res) => {
  try {
    let { id } = req.params;
    let { correo, nombre, apellido, originalCorreo, rol } = req.body;

    req.getConnection((err, conn) => {
      if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." });

      // Verificar si el correo ya está en uso
      if (correo !== originalCorreo) {
        conn.query("SELECT correo FROM user WHERE correo=?", [correo], (err, rows) => {
          if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." });
          if (rows.length > 0) return res.status(404).json({ errors: ["Este correo ya está usado"] });

          let expRegular = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;
          if (!expRegular.test(correo)) return res.status(404).json({ errors: ["El correo introducido no es válido"] });

          // Actualizar el usuario en la tabla principal
          actualizarConCorreo(conn,id,{ correo, nombre, apellido,originalCorreo,rol},res)
        });
      } else {
        // Si el correo no cambia, solo actualizar el nombre y apellido
        actualizarSinCorreo(conn, id, { correo, nombre, apellido, rol }, res);
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});
module.exports = ruta;
