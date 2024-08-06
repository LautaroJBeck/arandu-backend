const { Router } = require("express");
const { check } = require("express-validator");
const { validarCampos } = require("../helpers/validarCampos");

const bcryptjs = require("bcryptjs");
const generarJWT = require("../helpers/generarJWT");
const ruta = Router();

//Registrarse
ruta.post(
  "/",
  [
    check("nombre", "No introdujiste el nombre").not().isEmpty(),
    check("apellido", "No introdujiste el apellido").not().isEmpty(),
    check("password", "No introdujiste la contraseña").not().isEmpty(),
    check("correo", "No introdujiste el correo").not().isEmpty(),
    validarCampos,
  ],
  (req, res) => {
    let { nombre, apellido, password, correo } = req.body;
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
          conn.query("INSERT into user set ?",[{ nombre, apellido, password, correo }],(err, rows) => {
            if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            conn.query("SELECT * FROM user WHERE correo=? AND password=?",[correo,password],async (err, rows) => {      //Busca el ID de este usuario
              if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
              const { id, nombre, apellido, correo } = rows[0];
              const token = await generarJWT(id,nombre,apellido,correo);
              //A través del id, creo los puntajes del usuario
              ["basico","medio","avanzado"].forEach(el=>{
                let user_id=id;
                let nombre=el;
                conn.query("INSERT into unidad set ?",[{user_id,nombre}],(err,rows)=>{
                  if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                })
              })
              let arrayIds=[]
              //Se consiguen los IDs asignados dentro de la tabla nivel_id
              console.log("Hasta acá se ejecutó")
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
    let {correo,nombre,apellido}=req.body
    let {id}=req.params
    const token=await generarJWT(id,nombre,apellido,correo)
    return res.status(200).json({
        token,error:null
    })
  }catch(err){
    return res.status(500).json({ error: "Error al obtener el token." })
  }

})
//Borrar cuenta
ruta.delete("/:id",[
  check("password","No introdujiste la contraseña").not().isEmpty(),
  validarCampos
],(req,res)=>{
  try {
    let {id}=req.params
    let {password}=req.body
    req.getConnection((err,conn)=>{
      if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
        conn.query("SELECT * FROM user WHERE id=?",[id],(err,rows)=>{
          if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })

          let validPassword=bcryptjs.compareSync(password,rows[0].password)
          if(!validPassword){
            return res.status(400).json({
              errors:["No introdujiste tu contraseña correctamente"]
            })
          }
          conn.query("SELECT * FROM unidad where user_id=?",[id],(err,rows)=>{
            if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            
            for(let i=0;i<rows.length;i++){
              conn.query("DELETE FROM niveles where nivel_id=?",[rows[i].nivel_id],(err,rows)=>{
                if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
              })
            }
            conn.query("DELETE FROM unidad where user_id=?",[id],(err,rows)=>{
              if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
              conn.query("DELETE FROM user where id=?",[id],(err,rows)=>{
                return res.status(200).json({msg:"El usuario se eliminó correctamente"})
              })
            })

          })
        })
    })
  }catch{
    
  }
})

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
ruta.put("/:id",[
  check("nombre", "No introdujiste el nombre").not().isEmpty(),
  check("apellido", "No introdujiste el apellido").not().isEmpty(),
  check("correo", "No introdujiste el correo").not().isEmpty(),
  validarCampos,
],(req,res)=>{
  try{
    let {id}=req.params;
    let {correo,nombre,apellido,originalCorreo}=req.body
    req.getConnection((err,conn)=>{
      if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
        //Primera petición, comprueba si el correo que el usuario desea usar no esta ya usado
        if(correo!=originalCorreo){
          conn.query("SELECT correo FROM user WHERE correo=?",[correo],(err, rows) => {
            if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            if (rows.length > 0) return res.status(404).json({ errors: ["Este correo ya está usado"] })
            let expRegular=/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g
            if(!expRegular.test(correo)) return res.status(404).json({errors:["El correo introducido no es válido"]})
            conn.query("UPDATE user set ? WHERE id=?",[{correo,nombre,apellido},id],(err,rows)=>{
              if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
              return res.status(200).json({msg:"Los datos se actualizaron existosamente",newData:{
            correo,nombre,apellido}})
            })
          })
        }else{
          conn.query("UPDATE user set ? WHERE id=?",[{nombre,apellido},id],(err,rows)=>{
            if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            return res.status(200).json({msg:"Los datos se actualizaron existosamente",newData:{
          correo,nombre,apellido}})
          })
        }
    })
  }catch(err){
    return res.status(500).json({ error: "Error al conectar con la base de datos." })
  }
})
module.exports = ruta;
