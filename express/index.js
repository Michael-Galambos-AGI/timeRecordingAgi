const { json } = require("body-parser");
const express = require("express"),
  fs = require("fs"),
  { v4: uuidv4 } = require("uuid");
(app = express()), (port = process.env.PORT || 3000);

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
  console.log(jsonBody);
  fs.readFile("./express/user.json", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
    } else {
      data = JSON.parse(data);
      if (
        jsonBody.entryId === undefined &&
        jsonBody.date.endDate === undefined
      ) {
        const tag = data.eligibleTags.find((tag) => tag.name === jsonBody.tag);
        data.entries.push({
          id: uuidv4(),
          discription: jsonBody.discription,
          tag: tag.name,
          times: [
            {
              id: uuidv4(),
              date: jsonBody.date,
              duration: jsonBody.duration,
              status: jsonBody.status,
            },
          ],
        });
      } else if (jsonBody.entryId === undefined) {
        const startDate = new Date(jsonBody.date.startDate);
        console.log(startDate)
        //from milisecountds to days also i duno why i need the +1 but it works
        const duration =
          (startDate - new Date(jsonBody.date.startDate)) / 86400000 + 1;
        let times = [];
        for (i = 0; i < duration; i++) {
          let date = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate() + i
          );
          console.log(date)
          times.push({
            id: uuidv4(),
            date: date,
            duration: jsonBody.duration,
            status: jsonBody.status,
          });
        }
        const tag = data.eligibleTags.find((tag) => tag.name === jsonBody.tag);
        data.entries.push({
          id: uuidv4(),
          discription: jsonBody.discription,
          tag: tag.name,
          times: times,
        });
      } else {
        let entry = data.entries.find((entry) => entry.id === jsonBody.entryId);
        entry.times.push({
          id: jsonBody.timeId,
          date: jsonBody.date,
          duration: jsonBody.duration,
          status: jsonBody.status,
        });
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
