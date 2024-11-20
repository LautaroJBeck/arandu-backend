function formatToISODate(today2) {
    // Dividir la fecha en partes (día, mes, año)
    const [day, month, year] = today2.split('/');
  
    // Construir la fecha en formato YYYY-MM-DD
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
    return formattedDate;
}
module.exports=formatToISODate
