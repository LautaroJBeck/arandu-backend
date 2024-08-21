const {Router} =require("express");
const {check}=require("express-validator");
const { validarCampos } = require("../helpers/validarCampos");
const jwt=require("jsonwebtoken")
const bcryptjs =require("bcryptjs");
const generarJWT = require("../helpers/generarJWT");
const ruta=Router();



ruta.post("/",[
    check("correo","No introdujiste tu correo").not().isEmpty(),
    check("password","No introdujiste tu contraseña").not().isEmpty(),
    validarCampos
],(req,res)=>{
    let {correo,password}=req.body;
    req.getConnection((err,conn)=>{
        if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            conn.query("SELECT * from user where correo=?",[correo],async(err,rows)=>{
                if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                if(rows.length==0) {
                    return res.status(400).json({
                        errors: ["El correo no existe"]
                    })
                }
                let validPassword=bcryptjs.compareSync(password,rows[0].password);
                if(!validPassword){
                    return res.status(400).json({
                        errors:["La contraseña no es valida"]
                    })
                }
                //Generar el json web token
                let {id,nombre,apellido,correo,rol}=rows[0]
                const token=await generarJWT(id,nombre,apellido,correo,rol)
                return res.json({
                    token,error:null
                })
            })
    })
})




ruta.post("/token", (req, res) => {
    try {
        // Validar la existencia del encabezado de autorización
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(401).json({
                errors: ["Encabezado de autorización no proporcionado"]
            });
        }

        // Dividir el encabezado para obtener el token
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                errors: ["Token no proporcionado"]
            });
        }

        // Verificar el token
        jwt.verify(token, process.env.PRIVATE_KEY, (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    errors: ["Token no válido"]
                });
            }
            return res.json({
                decoded
            });
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            errors: ["Error interno del servidor"]
        });
    }
});
module.exports=ruta