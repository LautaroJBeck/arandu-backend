const jwt=require("jsonwebtoken")

const generarJWT=(id,nombre,apellido,correo,rol)=>{
    return new Promise ((resolve,reject)=>{
        let payload={id,nombre,apellido,correo,rol};
        console.log(process.env.PRIVATE_KEY)
        jwt.sign(payload,process.env.PRIVATE_KEY,{
            expiresIn:"31d",
            algorithm:"HS256"
        },(err,token)=>{
            if(err){
                console.log(err)
                reject("No se pudo generar el token")
            }else{
                resolve(token)
            }
        })
    })
     
}

module.exports=generarJWT
