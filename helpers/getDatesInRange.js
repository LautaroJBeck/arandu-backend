function getDatesInRange(startDate, endDate) {
    // Convertir las fechas de entrada en objetos Date
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Crear un array para almacenar las fechas
    const dateArray = [];

    // Iterar desde la fecha de inicio hasta la fecha final
    while (start <= end) {
        // Agregar la fecha actual al array en formato YYYY-MM-DD
        dateArray.push(start.toISOString().split('T')[0]);

        // Avanzar al siguiente día
        start.setDate(start.getDate() + 1);
    }

    return dateArray;
}
module.exports=getDatesInRange