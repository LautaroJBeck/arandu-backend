const app=require("./app");

app.listen(app.get("PORT"),()=>{
    console.log(`Servidor iniciado en el puerto ${app.get("PORT")}`)
})