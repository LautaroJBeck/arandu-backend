
const actualizarConCorreo=(conn,id,datos,res)=>{
    const { correo, nombre, apellido,originalCorreo,rol} = datos;
    conn.query("UPDATE user SET ? WHERE id=?", [{ nombre, apellido, correo }, id], (err) => {
        if (err) return res.status(500).json({ error: "Error al actualizar los datos del usuario en la base de datos." });
    
        // Actualizar en la tabla `solicitud_pendiente` como profesor
        conn.query("UPDATE solicitud_pendiente SET nombre_profesor=?, apellido_profesor=?, correo_profesor=? WHERE profesor_id=?", [nombre, apellido, correo, id], (err) => {
          if (err) return res.status(500).json({ error: "Error al actualizar las solicitudes pendientes del profesor." });
    
          // Actualizar en la tabla `solicitud_pendiente` como alumno
          conn.query("UPDATE solicitud_pendiente SET correo_alumno=? WHERE correo_alumno=?", [correo, originalCorreo], (err) => {
            if (err) return res.status(500).json({ error: "Error al actualizar las solicitudes pendientes del alumno." });
    
            // Actualizar en la tabla `relaciones` (como profesor)
            conn.query("UPDATE relaciones SET nombre_profesor=?, apellido_profesor=?, correo_profesor=? WHERE profesor_id=?", [nombre, apellido, correo, id], (err) => {
              if (err) return res.status(500).json({ error: "Error al actualizar las relaciones del profesor." });
    
              // Actualizar en la tabla `relaciones` (como alumno)
              conn.query("UPDATE relaciones SET nombre_alumno=?, apellido_alumno=?, correo_alumno=? WHERE alumno_id=?", [nombre, apellido, correo, id], (err) => {
                if (err) return res.status(500).json({ error: "Error al actualizar las relaciones del alumno." });
    
                // Finalmente, responder con éxito
                return res.status(200).json({ msg: "Los datos se actualizaron exitosamente", newData: { correo, nombre, apellido, rol } });
              });
            });
          });
        });
      });
}
const actualizarSinCorreo=(conn,id,datos,res)=>{
    const { nombre, apellido,correo,rol} = datos;
    conn.query("UPDATE user SET ? WHERE id=?", [{ nombre, apellido }, id], (err) => {
        if (err) return res.status(500).json({ error: "Error al actualizar los datos del usuario en la base de datos." });
    
        // Actualizar en la tabla `solicitud_pendiente` como profesor
        conn.query("UPDATE solicitud_pendiente SET nombre_profesor=?, apellido_profesor=? WHERE profesor_id=?", [nombre, apellido ,id], (err) => {
          if (err) return res.status(500).json({ error: "Error al actualizar las solicitudes pendientes del profesor." });
            // Actualizar en la tabla `relaciones` (como profesor)
            conn.query("UPDATE relaciones SET nombre_profesor=?, apellido_profesor=? WHERE profesor_id=?", [nombre, apellido, id], (err) => {
              if (err) return res.status(500).json({ error: "Error al actualizar las relaciones del profesor." });
    
              // Actualizar en la tabla `relaciones` (como alumno)
              conn.query("UPDATE relaciones SET nombre_alumno=?, apellido_alumno=? WHERE alumno_id=?", [nombre, apellido, id], (err) => {
                if (err) return res.status(500).json({ error: "Error al actualizar las relaciones del alumno." });
                // Finalmente, responder con éxito
                return res.status(200).json({ msg: "Los datos se actualizaron exitosamente", newData: { correo, nombre, apellido,rol } });
            });
          });
        });
      });
}
module.exports={actualizarConCorreo,actualizarSinCorreo}