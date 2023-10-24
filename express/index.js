const { json } = require("body-parser");
const express = require("express"),
  fs = require("fs"),
  { v4: uuidv4 } = require("uuid");
(app = express()), (port = 3000);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.json());

app.get("/user", (req, res) => {
  res.set("Content-Type", "application/json");
  let json;
  fs.readFile("./express/user.json", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
    } else {
      json = JSON.parse(data);
      res.json(json);
    }
  });
});
app.post("/entry", (req, res) => {
  const jsonBody = req.body;
  fs.readFile("./express/user.json", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
    data = JSON.parse(data);
    let type;
    const entry = data.entries.find(
      (element) =>
        element.description === jsonBody.description &&
        element.tag === jsonBody.tag
    );
    if (
      jsonBody.date.endDate &&
      jsonBody.date.startDate === jsonBody.date.endDate
    ) {
      jsonBody.date = jsonBody.date.startDate;
    }
    if (!entry && !jsonBody.date.endDate) {
      type = 1;
    } else if (!entry) {
      type = 2;
    } else if (entry && !jsonBody.date.endDate) {
      type = 3;
    } else {
      type = 4;
    }
    const tag = data.eligibleTags.find((tag) => tag.name === jsonBody.tag);
    switch (type) {
      // new single day entry
      case 1: {
        data.entries.push({
          id: uuidv4(),
          description: jsonBody.description,
          tag: tag.name,
          times: [
            {
              id: uuidv4(),
              date: new Date(jsonBody.date).getTime(),
              duration: jsonBody.duration,
              status: jsonBody.status,
              changed: new Date().getTime(),
            },
          ],
        });
        break;
      }
      // new multy day entry
      case 2: {
        const startDate = new Date(jsonBody.date.startDate);
        //from milisecountds to days also i duno why i need the +1 but it works
        const duration =
          (new Date(jsonBody.date.endDate) - startDate) / 86400000 + 1;
        let times = [];
        for (let i = 0; i < duration; i++) {
          const date = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate() + i
          );
          if (date.getDay() === 0 || date.getDay() === 6) continue;
          times.push({
            id: uuidv4(),
            date: date.getTime(),
            duration: jsonBody.duration,
            status: jsonBody.status,
            changed: new Date().getTime(),
          });
        }
        data.entries.push({
          id: uuidv4(),
          description: jsonBody.description,
          tag: tag.name,
          times: times,
        });
        break;
      }
      // new time to exsiting entry
      case 3: {
        entry.times.push({
          id: jsonBody.timeId || uuidv4(),
          date: new Date(jsonBody.date).getTime(),
          duration: jsonBody.duration,
          status: jsonBody.status,
          changed: new Date().getTime(),
        });
        break;
      }
      // multiple new times to existing entry
      case 4: {
        const startDate = new Date(jsonBody.date.startDate);
        //from milisecountds to days also i duno why i need the +1 but it works
        const duration =
          (new Date(jsonBody.date.endDate) - startDate) / 86400000 + 1;
        for (let i = 0; i < duration; i++) {
          const date = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate() + i
          );
          if (date.getDay() === 0 || date.getDay() === 6) continue;
          entry.times.push({
            id: uuidv4(),
            date: date.getTime(),
            duration: jsonBody.duration,
            status: jsonBody.status,
            changed: new Date().getTime(),
          });
        }
        break;
      }
    }
    fs.writeFile(
      "./express/user.json",
      JSON.stringify(data, null, 2),
      (err) => {
        if (err) {
          console.log(err);
          res.sendStatus(500);
          return;
        }
      }
    );
    res.sendStatus(200);
  });
});
app.post("/delete", (req, res) => {
  const jsonBody = req.body;
  fs.readFile("./express/user.json", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
    } else {
      data = JSON.parse(data);
      let entry = data.entries.find((entry) => entry.id === jsonBody.entryId);
      let index = entry.times.map((time) => time.id).indexOf(jsonBody.timeId);
      entry.times.splice(index, 1);
      if (entry.times.length === 0) {
        index = data.entries.map((entry) => entry.id).indexOf(jsonBody.entryId);
        data.entries.splice(index, 1);
      }
      fs.writeFile(
        "./express/user.json",
        JSON.stringify(data, null, 2),
        (err) => {
          if (err) {
            console.log(err);
            res.sendStatus(500);
            return;
          }
        }
      );
      res.sendStatus(200);
    }
  });
});

app.listen(port, () => {
  console.log("URL: http://localhost:" + port);
});
