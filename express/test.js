let ndate = new Date();

let date = Date.UTC(ndate.getFullYear(), ndate.getMonth(), ndate.getDate());
let date2 = Date.UTC(2023, 9, 30);

ndate.setUTCHours(0,0,0,0)
console.log(ndate.getTime())
