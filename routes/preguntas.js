const {Router}=require("express")

const ruta=Router();


//Para obtener las preguntas

ruta.get("/:nivel/:tipo",(req,res)=>{
    req.getConnection((err,conn)=>{
        if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." });
            const{nivel,tipo} =req.params
            let nivelPreguntas=["basico","medio","avanzado"];
            /*    contexto float,
            significado float,
            central float,
            conexiones float,
            estructura float,
            inferencias float,
            textuales float,
            numericas float */
            let tipoPreguntas=
            ["contexto","significado","central",
            "conexiones","estructura","inferencias",
            "textuales"]
            if(!nivelPreguntas.includes(nivel)) return res.json({err:"El nivel de pregunta no existe"})
            if(!tipoPreguntas.includes(tipo)) return res.json({err:"El tipo de pregunta no existe"})
            conn.query("SELECT * FROM preguntas WHERE tipo = ? and nivel = ?",[tipo,nivel],(err,rows)=>{
                if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
                let numerosAleatorios=[]
                while(numerosAleatorios.length<4){
                    let numeroAleatorio=Math.floor(Math.random()*rows.length)
                    if(!numerosAleatorios.includes(numeroAleatorio)){
                        numerosAleatorios.push(numeroAleatorio)
                    }
                }
                let listaPreguntas=[]
                for(let i=0;i<numerosAleatorios.length;i++){
                    listaPreguntas.push(rows[numerosAleatorios[i]])
                }
                return res.json({listaPreguntas})
            })
           
    })
})
ruta.post("/:nivel/:tipo",(req,res)=>{
    let nivelPreguntas=["basico","medio","avanzado"];
    let tipoPreguntas=
    ["contexto","significado","central",
    "conexiones","estructura","inferencias",
    "textuales"]
    req.getConnection((err,conn)=>{
        if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." });
        const {nivel,tipo} =req.params
        const {
            texto,
            subrayado,
            pregunta_correcta,
            pregunta_incorrecta1,pregunta_incorrecta2,pregunta_incorrecta3,
            explicacion_correcta,
            explicacion_incorrecta1,explicacion_incorrecta2,explicacion_incorrecta3} =req.body
        if(!nivelPreguntas.includes(nivel)) return res.json({err:"El nivel de pregunta no existe"})
        if(!tipoPreguntas.includes(tipo)) return res.json({err:"El tipo de pregunta no existe"})
        conn.query("INSERT into preguntas set ?",[{
        tipo,nivel,subrayado,
        texto,pregunta_correcta,
        pregunta_incorrecta1,pregunta_incorrecta2,
        pregunta_incorrecta3,explicacion_correcta,
        explicacion_incorrecta1,explicacion_incorrecta2,
        explicacion_incorrecta3  
        }],(err, rows) => {
            if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." });
            return res.status(200).json({msg:"Los datos se agregaron exitosamente"})
        })
    })
})
module.exports=ruta