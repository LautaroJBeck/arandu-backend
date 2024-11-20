function parseDate(dateString){
    if(dateString instanceof Date){
      // dateObj es un objeto Date
      const year = dateString.getFullYear();
      const month = dateString.getMonth(); // Los meses en JavaScript van de 0 (enero) a 11 (diciembre)
      const day = dateString.getDate();
      // Crear un nuevo objeto Date con la hora establecida a las 00:00:00
      return new Date(year, month, day);
    }else{
      const [year,month,day]=dateString.split("-").map(Number)
      return new Date(year,month-1,day)
    }
  
}
module.exports=parseDate