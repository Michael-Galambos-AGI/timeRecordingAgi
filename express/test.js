async function asdf() {
  const model = await fetch("http://localhost:3000/getUser", {
    method: "GET",
  });
  return model
}




async function qwer() {
  let a = asdf()
  console.log(a)
  console.log("asdfafsd")
}


qwer()



































/*
const dStartDate = new Date(2023, 7, 2, 0, 0, 0, 0);
const dEndDate = new Date();
dEndDate.setHours(0, 0, 0, 0);
dEndDate.setHours(
  0,
  dEndDate.getMinutes() - dEndDate.getTimezoneOffset(),
  0,
  0
);
dStartDate.setHours(
  0,
  dStartDate.getMinutes() - dStartDate.getTimezoneOffset(),
  0,
  0
);

const dStartYear = dStartDate.getFullYear();
const dEndYear = dEndDate.getFullYear();
const yearDifference = dEndYear - dStartYear;


const days = (dEndDate - dStartDate) / 1000 / 60 / 60 / 24;
let count = 0;
for (let i = 0; i < days; i++) {
  const dDate = new Date(
    dStartDate.getFullYear(),
    dStartDate.getMonth(),
    dStartDate.getDate() + i,
    0,
    0,
    0,
    0
  );
  if (dDate.getDay() !== 0 && dDate.getDay() !== 6) count++;
}
console.log("workdays: " + count);
console.log("workhours: " + count * 8.4 * 1);
*/