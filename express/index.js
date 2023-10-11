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
  fs.readFile("./express/user.json", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
    } else {
      data = JSON.parse(data);
      if (jsonBody.entryid === undefined) {
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
      } else {
        let entry = data.entries.find((entry) => entry.id === jsonBody.entryid);
        entry.timers.push({
          id: uuidv4(),
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
