const {Router}=require("express")

const ruta=Router();
// Mandar solicitud Maestro -> Alumno
// Aceptar solicitud Alumno -> Maestro
// Ver profesores
// Ver alumnos - Examenes de los alumnos
ruta.post("/",(req,res)=>{
    let {correo_alumno,correo_profesor,nombre_profesor,apellido_profesor,profesor_id}=req.body
    req.getConnection((err,conn)=>{
        if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
        conn.query("SELECT * from user where correo=?",[correo_alumno],(req,rows)=>{
            if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            if (rows.length == 0) return res.status(404).json({ errors: ["Este correo no existe"] })
            conn.query("SELECT * from relaciones where profesor_id=? AND correo_alumno=?",[profesor_id,correo_alumno],(err,rows)=>{
                if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                if (rows.length > 0) return res.status(404).json({ errors: ["Ya agregaste a este alumno"] })
                conn.query("SELECT * from solicitud_pendiente where profesor_id=? AND correo_alumno=?",[profesor_id,correo_alumno],(err,rows)=>{
                    if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                    if(rows.length>0) return res.status(404).json({errors:["Ya mandaste una solicitud a este alumno"]})
                    conn.query("INSERT into solicitud_pendiente set ?",[{correo_alumno,correo_profesor,nombre_profesor,apellido_profesor,profesor_id}],(err,rows)=>{
                        if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                        return res.status(200).json({msg:"La solicitud se mandó correctamente"})
                    })
                })
            })
        })
    })
})
//Obtener listado de solicitudes siendo alumno
ruta.get("/solicitudes/:correo_alumno",(req,res)=>{
    let {correo_alumno}=req.params
    req.getConnection((err,conn)=>{
        if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            conn.query("SELECT * FROM solicitud_pendiente where correo_alumno=?",[correo_alumno],(err,rows)=>{
                if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                    return res.status(200).json(rows)
            })
    })
})
//Obtener listado de solicitudes siendo profesor
ruta.get("/solicitudes/profesor/:correo_profesor",(req,res)=>{
    let {correo_profesor}=req.params
    req.getConnection((err,conn)=>{
        if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
        conn.query("SELECT * FROM solicitud_pendiente where correo_profesor=?",[correo_profesor],(err,rows)=>{
            if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            return res.status(200).json(rows)
        })
    })
})
//Aceptar o rechazar una solicitud
ruta.post("/aceptar",(req,res)=>{
    let {alumno_id,
        profesor_id,
        respuesta,
        correo_alumno,
        correo_profesor,
        nombre_profesor,
        nombre_alumno,
        apellido_alumno,
        apellido_profesor}=req.body;
    req.getConnection((err,conn)=>{
        if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
        if(respuesta){
            conn.query("INSERT INTO relaciones set ?",[{profesor_id,
                alumno_id,
                correo_alumno,
                correo_profesor,
                nombre_profesor,
                nombre_alumno,
                apellido_alumno,
                apellido_profesor    
            }],(err,rows)=>{
                if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                conn.query("DELETE from solicitud_pendiente where correo_alumno=? AND profesor_id=?",[correo_alumno,profesor_id],(err,rows)=>{
                    if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                    return res.status(200).json({msg:"El docente fue agregado a tu lista de profesores"})
                })
            })
        }else{
            conn.query("DELETE from solicitud_pendiente where correo_alumno=? AND profesor_id=?",[correo_alumno,profesor_id],(err,rows)=>{
                
                if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                return res.status(200).json({msg:"La solicitud fue eliminada"})
            }) 
        }
    })
})
//Obtener listado de profesores siendo un alumno
ruta.get("/profesores/:alumno_id",(req,res)=>{
    let {alumno_id}=req.params
    req.getConnection((err,conn)=>{
        if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
        conn.query("SELECT * FROM relaciones where alumno_id=?",[alumno_id],(err,rows)=>{
            if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            return res.status(200).json(rows)
        })
    })
})
//Obtener listado de alumnos siendo profesor
ruta.get("/alumnos/:profesor_id",(req,res)=>{
    let {profesor_id}=req.params
    req.getConnection((err,conn)=>{
        if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
        conn.query("SELECT * FROM relaciones where profesor_id=?",[profesor_id],(err,rows)=>{
            if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            return res.status(200).json(rows)
        })
    })
})
// Remover un profesor de la lista
ruta.delete("/profesores",(req,res)=>{
    let {alumno_id,profesor_id}=req.body
    req.getConnection((err,conn)=>{
        if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
        conn.query("DELETE FROM relaciones where alumno_id=? AND profesor_id=?",[alumno_id,profesor_id],(err,rows)=>{
            if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            return res.status(200).json({msg:"El profesor fue eliminado exitosamente"})
            
        })
    })
})
module.exports=ruta