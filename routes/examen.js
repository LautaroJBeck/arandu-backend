const {Router}=require("express")

const ruta=Router();

// Function to shuffle an array using the Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
// Function to create the array k
function createArrayK(i, j) {
    // Shuffle array i
    const shuffledI = shuffleArray([...i]);

    // Create a new array j with exactly two repetitions of each element
    const newJ = [];
    j.forEach(num => {
        newJ.push(num);
        newJ.push(num);
    });
    shuffleArray(newJ);

    // Ensure that we have exactly two of each level
    const levelsCount = { "basico": 0, "medio": 0, "avanzado": 0 };
    const k = [];
    const usedPairs = new Set();
    while (k.length < 6) {
        const randI = shuffledI[Math.floor(Math.random() * shuffledI.length)];
        const randJ = newJ[Math.floor(Math.random() * newJ.length)];
        if (levelsCount[randJ] < 2) {
            const pair = [randI, randJ];
            const pairString = JSON.stringify(pair);
            if (!usedPairs.has(pairString)) {
                k.push(pair);
                usedPairs.add(pairString);
                levelsCount[randJ]++;
            }
        }
    }

    return k;
}
// Express route
/*
TODO List
1. Generar una ruta para mandar ejercicios de unidades
2. Generar una ruta para agregar examenes de unidades
*/
// Mandar preguntas para un examen general
ruta.get("/", (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
        const finalArray = [];
        
        // Shufflear ejercicios de comprension literal 
        let niveles = ["basico", "medio", "avanzado"];
        let ejerciciosLiteral = ["central", "conexiones", "estructura"];
        let arrayResultados = createArrayK(ejerciciosLiteral, niveles);

        // Query para decodificacion
        const queryDecodificacion = `
        SELECT DISTINCT id, tipo, nivel, texto, subrayado, pregunta_correcta, pregunta_incorrecta1, pregunta_incorrecta2, pregunta_incorrecta3,
        explicacion_correcta, explicacion_incorrecta1, explicacion_incorrecta2, explicacion_incorrecta3
        FROM (
            (SELECT * FROM preguntas WHERE tipo = 'contexto' AND nivel = 'basico' ORDER BY RAND() LIMIT 1)
            UNION ALL
            (SELECT * FROM preguntas WHERE tipo = 'contexto' AND nivel = 'medio' ORDER BY RAND() LIMIT 1)
            UNION ALL
            (SELECT * FROM preguntas WHERE tipo = 'contexto' AND nivel = 'avanzado' ORDER BY RAND() LIMIT 1)
            UNION ALL
            (SELECT * FROM preguntas WHERE tipo = 'significado' AND nivel = 'basico' ORDER BY RAND() LIMIT 1)
            UNION ALL
            (SELECT * FROM preguntas WHERE tipo = 'significado' AND nivel = 'medio' ORDER BY RAND() LIMIT 1)
            UNION ALL
            (SELECT * FROM preguntas WHERE tipo = 'significado' AND nivel = 'avanzado' ORDER BY RAND() LIMIT 1)
        ) AS subquery;
      `;

        const queryLiteral = `
        SELECT DISTINCT id, tipo, nivel, texto, subrayado, pregunta_correcta, pregunta_incorrecta1, pregunta_incorrecta2, pregunta_incorrecta3,
        explicacion_correcta, explicacion_incorrecta1, explicacion_incorrecta2, explicacion_incorrecta3
        FROM (
            (SELECT * FROM preguntas WHERE tipo = '${arrayResultados[0][0]}' AND nivel = '${arrayResultados[0][1]}' ORDER BY RAND() LIMIT 1)
            UNION ALL
            (SELECT * FROM preguntas WHERE tipo = '${arrayResultados[1][0]}' AND nivel = '${arrayResultados[1][1]}' ORDER BY RAND() LIMIT 1)
            UNION ALL
            (SELECT * FROM preguntas WHERE tipo = '${arrayResultados[2][0]}' AND nivel = '${arrayResultados[2][1]}' ORDER BY RAND() LIMIT 1)
            UNION ALL
            (SELECT * FROM preguntas WHERE tipo = '${arrayResultados[3][0]}' AND nivel = '${arrayResultados[3][1]}' ORDER BY RAND() LIMIT 1)
            UNION ALL
            (SELECT * FROM preguntas WHERE tipo = '${arrayResultados[4][0]}' AND nivel = '${arrayResultados[4][1]}' ORDER BY RAND() LIMIT 1)
            UNION ALL
            (SELECT * FROM preguntas WHERE tipo = '${arrayResultados[5][0]}' AND nivel = '${arrayResultados[5][1]}' ORDER BY RAND() LIMIT 1)
        ) AS subquery;
            `;

        const queryInferencial = `
        SELECT DISTINCT id, tipo, nivel, texto, subrayado, pregunta_correcta, pregunta_incorrecta1, pregunta_incorrecta2, pregunta_incorrecta3,
        explicacion_correcta, explicacion_incorrecta1, explicacion_incorrecta2, explicacion_incorrecta3
        FROM (
            (SELECT * FROM preguntas WHERE tipo = 'inferencias' AND nivel = 'basico' ORDER BY RAND() LIMIT 1)
            UNION ALL
            (SELECT * FROM preguntas WHERE tipo = 'inferencias' AND nivel = 'medio' ORDER BY RAND() LIMIT 1)
            UNION ALL
            (SELECT * FROM preguntas WHERE tipo = 'inferencias' AND nivel = 'avanzado' ORDER BY RAND() LIMIT 1)
            UNION ALL
            (SELECT * FROM preguntas WHERE tipo = 'textuales' AND nivel = 'basico' ORDER BY RAND() LIMIT 1)
            UNION ALL
            (SELECT * FROM preguntas WHERE tipo = 'textuales' AND nivel = 'medio' ORDER BY RAND() LIMIT 1)
            UNION ALL
            (SELECT * FROM preguntas WHERE tipo = 'textuales' AND nivel = 'avanzado' ORDER BY RAND() LIMIT 1)
        ) AS subquery;
            `;
        conn.query(queryDecodificacion, (err, rows) => {
            if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            finalArray.push(...rows);
            conn.query(queryLiteral, (err, rows) => {
                if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." });
                finalArray.push(...rows);
                conn.query(queryInferencial, (err, rows) => {
                    if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." });
                    finalArray.push(...rows);
                    return res.status(200).json({ listaPreguntas: shuffleArray(finalArray) });
                });
            });
        });
    });
});
// Mandar preguntas para un examen de unidad
ruta.get("/:nivel",(req,res)=>{
    let {nivel}=req.params
    req.getConnection((err,conn)=>{
        if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            const query=`
                   SELECT DISTINCT id, tipo, nivel, texto, subrayado, pregunta_correcta, pregunta_incorrecta1, pregunta_incorrecta2, pregunta_incorrecta3,
        explicacion_correcta, explicacion_incorrecta1, explicacion_incorrecta2, explicacion_incorrecta3
            FROM (
                (SELECT * FROM preguntas WHERE tipo = 'contexto' AND nivel = '${nivel}' ORDER BY RAND() LIMIT 3)
                UNION ALL
                (SELECT * FROM preguntas WHERE tipo = 'significado' AND nivel = '${nivel}' ORDER BY RAND() LIMIT 3)
                UNION ALL
                (SELECT * FROM preguntas WHERE tipo = 'textuales' AND nivel = '${nivel}' ORDER BY RAND() LIMIT 3)
                UNION ALL
                (SELECT * FROM preguntas WHERE tipo = 'inferencias' AND nivel = '${nivel}' ORDER BY RAND() LIMIT 3)
                UNION ALL
                (SELECT * FROM preguntas WHERE tipo = 'central' AND nivel = '${nivel}' ORDER BY RAND() LIMIT 2)
                UNION ALL
                (SELECT * FROM preguntas WHERE tipo = 'conexiones' AND nivel = '${nivel}' ORDER BY RAND() LIMIT 2)
                UNION ALL
                (SELECT * FROM preguntas WHERE tipo = 'estructura' AND nivel = '${nivel}' ORDER BY RAND() LIMIT 2)
            ) AS subquery;
                `
                conn.query(query,(err,rows)=>{
                    if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." });
                    console.log(rows)
                    return res.status(200).json({ listaPreguntas: shuffleArray(rows) });
                })
    })
})
ruta.get("/historial/:id",(req,res)=>{
    try {
        req.getConnection((err,conn)=>{
            if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            let {id}=req.params
            conn.query("SELECT * FROM examen WHERE user_id=?",[id],(err,rows)=>{
                return res.status(200).json({listaExamenes:rows})
            })
        })
    } catch (error) {
        
    }
})
// Arreglar este
ruta.get("/puntaje/:id_examen/:nivel",(req,res)=>{
    try {
        req.getConnection((err,conn)=>{
            if(err) return res.status(500).json({ error: "Error al conectar con la base de datos." })
            let {id_examen,nivel}=req.params
        if(nivel=="general"){
            conn.query("SELECT * FROM puntajes_general where id_examen=?",[id_examen],(err,rows)=>{
                return res.status(200).json(rows)
            })
        }else{
            conn.query("SELECT * FROM puntajes_unidad where id_examen=?",[id_examen],(err,rows)=>{
                return res.status(200).json(rows)
            }) 
        }
        }) 
    } catch (error) {
        
    }

})
//Agregar examen terminado
ruta.post("/", (req, res) => {
    const { user_id, data, total } = req.body;

    // Verificar que los datos requeridos estén presentes
    if (!user_id || !data || total === undefined) {
        return res.status(400).json({ error: "Faltan datos requeridos en la solicitud." });
    }

    req.getConnection((err, conn) => {
        if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." });

        // Iniciar una transacción
        conn.beginTransaction((err) => {
            if (err) return res.status(500).json({ error: "Error al iniciar la transacción." });

            // Check if the user has added an exam in the last 30 seconds
            const checkRecentExamQuery = `
                SELECT * FROM examen 
                WHERE user_id = ? AND TIMESTAMPDIFF(SECOND, fecha, NOW()) < 15
            `;

            conn.query(checkRecentExamQuery, [user_id], (err, recentExams) => {
                if (err) {
                    return conn.rollback(() => {
                        res.status(500).json({ error: "Error al verificar exámenes recientes." });
                    });
                }

                if (recentExams.length > 0) {
                    return res.status(429).json({ msg: "You can only submit one exam every 15 seconds." });
                }

                // Proceed to insert new exam
                conn.query("INSERT INTO examen SET ?", [{ user_id, total,nivel:"general" }], (err, rows) => {
                    if (err) {
                        return conn.rollback(() => {
                            res.status(500).json({ error: "Error al insertar nuevo examen." });
                        });
                    }

                    const examId = rows.insertId;
                    const tipos = {
                        contexto: "decodificacion",
                        significado: "decodificacion",
                        central: "literal",
                        conexiones: "literal",
                        estructura: "literal",
                        inferencias: "inferencial",
                        textuales: "inferencial",
                    };

                    const puntajes = {
                        decodificacion: { basico: 0, medio: 0, avanzado: 0 },
                        literal: { basico: 0, medio: 0, avanzado: 0 },
                        inferencial: { basico: 0, medio: 0, avanzado: 0 }
                    };

                    // Verificación y cálculo de puntajes
                    data.forEach(([correcto, nivel, tipo]) => {
                        if (correcto && tipos[tipo]) {
                            puntajes[tipos[tipo]][nivel]++;
                            console.log(`Tipo: ${tipo}, Nivel: ${nivel}, Puntaje actualizado:`, puntajes);
                        } else {
                            console.warn(`Datos incorrectos o no encontrados para tipo: ${tipo}, nivel: ${nivel}`);
                        }
                    });
                    conn.query("INSERT INTO puntajes_general SET ?", [{
                        id_examen: examId,
                        basico_decodificacion: puntajes.decodificacion.basico,
                        medio_decodificacion: puntajes.decodificacion.medio,
                        avanzado_decodificacion: puntajes.decodificacion.avanzado,

                        basico_literal: puntajes.literal.basico,
                        medio_literal: puntajes.literal.medio,
                        avanzado_literal: puntajes.literal.avanzado,

                        basico_inferencial: puntajes.inferencial.basico,
                        medio_inferencial: puntajes.inferencial.medio,
                        avanzado_inferencial: puntajes.inferencial.avanzado,
                    }], (err, rows) => {
                        if (err) {
                            return conn.rollback(() => {
                                res.status(500).json({ error: "Error al confirmar la transacción." });
                            });
                        }
                        return res.status(200).json({ msg: "Los datos se agregaron exitosamente",puntajes })
                    });
                });
            });
        });
    });
});
ruta.post("/:nivel",(req,res)=>{
    let {nivel} =req.params;
    const { user_id, data, total } = req.body;

    // Verificar que los datos requeridos estén presentes
    if (!user_id || !data || total === undefined) {
        return res.status(400).json({ error: "Faltan datos requeridos en la solicitud." });
    }
    req.getConnection((err, conn) => {
        if (err) return res.status(500).json({ error: "Error al conectar con la base de datos." });

        // Iniciar una transacción
        conn.beginTransaction((err) => {
            if (err) return res.status(500).json({ error: "Error al iniciar la transacción." });

            // Check if the user has added an exam in the last 30 seconds
            const checkRecentExamQuery = `
                SELECT * FROM examen 
                WHERE user_id = ? AND TIMESTAMPDIFF(SECOND, fecha, NOW()) < 15
            `;

            conn.query(checkRecentExamQuery, [user_id], (err, recentExams) => {
                if (err) {
                    return conn.rollback(() => {
                        res.status(500).json({ error: "Error al verificar exámenes recientes." });
                    });
                }

                if (recentExams.length > 0) {
                    return res.status(429).json({ msg: "You can only submit one exam every 15 seconds." });
                }

                // Proceed to insert new exam
                conn.query("INSERT INTO examen SET ?", [{ user_id, total,nivel }], (err, rows) => {
                    if (err) {
                        return conn.rollback(() => {
                            res.status(500).json({ error: "Error al insertar nuevo examen." });
                        });
                    }
                    const examId = rows.insertId;
                    const tipos = {
                        contexto: "decodificacion",
                        significado: "decodificacion",
                        central: "literal",
                        conexiones: "literal",
                        estructura: "literal",
                        inferencias: "inferencial",
                        textuales: "inferencial",
                    };
                    const puntajes = {
                        decodificacion: 0,
                        literal: 0,
                        inferencial: 0  ,
                    };
                    data.forEach(([correcto,tipo])=>{
                        if(correcto &&tipos[tipo]){
                            puntajes[tipos[tipo]]++
                        }else{
                            console.warn(`Datos incorrectos o no encontrados para tipo: ${tipo}, nivel: ${nivel}`); 
                        }
                    })
                    conn.query("INSERT INTO puntajes_unidad SET ?",[{
                        id_examen: examId,
                        nivel,
                        decodificacion:puntajes.decodificacion,
                        literal:puntajes.literal,
                        inferencial:puntajes.inferencial
                    }],(err, rows) => {
                        if (err) {
                            return conn.rollback(() => {
                                res.status(500).json({ error: "Error al insertar nuevo examen." });
                            });
                        }else{
                            res.status(200).json({ msg: "Los datos se agregaron exitosamente",puntajes });
                        }

                    })
                });
            });
        });
    });
})



module.exports=ruta