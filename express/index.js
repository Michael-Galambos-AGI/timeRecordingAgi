const express = require("express"),
  fs = require("fs"),
  { v4: uuidv4 } = require("uuid");
(app = express()), (port = 3000);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PATCH");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.json());

app.get("/getUser", (req, res) => {
  fs.readFile("./express/user.json", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
      return;
    }
    data = JSON.parse(data);

    tagIdToName(data);
    res.status(200).json(data);
  });
});
app.post("/post", (req, res) => {
  const reqBody = req.body;
  fs.readFile("./express/user.json", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
      return;
    }
    data = JSON.parse(data);

    if (reqBody.entryId) {
      /*
      template
      {
        entryId: string
        //description: string
        //tag: int
        times:{
          startDate: int
          endDate: int
          duration: int
          status: string
        }
      }
      */
      postTime(data, reqBody);
    } else {
      /*
      template
      {
        description: string
        tag: int
        ?defaultDuration: int
        favorite: bool
        times:{
          startDate: int
          endDate: int
          duration: string
          status: string
        }
      }
      */
      postEntry(data, reqBody);
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
        tagIdToName(data);
        res.status(200).json(data);
      }
    );
  });
});
app.delete("/delete", (req, res) => {
  const reqBody = req.body;
  fs.readFile("./express/user.json", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
      return;
    }
    data = JSON.parse(data);

    if (reqBody.timeId) {
      /*
      template
      {
        entryId: string, 
        timeId: string
      }
      */
      deleteTime(data, reqBody);
    } else {
      /*
      template
      {
        entryId: string
      }
      */
      deleteEntry(data, reqBody);
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
        tagIdToName(data);
        res.status(200).json(data);
      }
    );
  });
});
app.patch("/patch", (req, res) => {
  const reqBody = req.body;
  fs.readFile("./express/user.json", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
      return;
    }
    data = JSON.parse(data);

    if (reqBody.timeId) {
      /*
      template
      {
      entryId: string, 
      timeId: string
      ?date: int
      ?duration: string
      ?status: string
      }
      */
      patchTime(data, reqBody);
    } else {
      /*
      template
      {
        entryId: string
        ?description: string
        ?tag: int
        ?defaultDuration: int 
        ?favorite: bool
      }
      */
      patchEntry(data, reqBody);
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
        tagIdToName(data);
        res.status(200).json(data);
      }
    );
  });
});
app.listen(port, () => {
  console.log("URL: http://localhost:" + port);
});

function createTimes(timesArr = [], times) {
  /*
  times input template
  {
    startDate: int
    endDate: int
    duration: int
    status: string
  }
  output template
  [
    {
    id: string
    changed: int
    date: int
    duration: int
    status: string
    },
    ...
  ]
  */
  const length =
    ((times.endDate || times.startDate) - times.startDate) /
    1000 /
    60 /
    60 /
    24;
  for (let i = 0; i <= length; i++) {
    const date = new Date(times.startDate + i * 1000 * 60 * 60 * 24);
    timesArr.push({
      id: uuidv4(),
      changed: Date.now(),
      date: date.getTime(),
      duration: times.duration,
      status: times.status,
    });
  }
  return timesArr;
}

function tagIdToName(data) {
  const tags = new Map(data.tags.map((tag) => [tag.id, tag.name]));
  data.entries.forEach((entry) => {
    entry.tag = tags.get(entry.tag);
  });
}

function postEntry(data, reqBody) {
  const tags = new Map(data.tags.map((tag) => [tag.name, tag.id]));
  const id = uuidv4();

  data.entries.push({
    id: id,
    description: reqBody.description,
    tag: tags.get(reqBody.tag),
    defaultDuration: reqBody.defaultDuration || reqBody.duration,
    favorite: reqBody.favorite || false,
    times: createTimes([], reqBody.times),
  });
}

function postTime(data, reqBody) {
  let times = data.entries.find((entry) => entry.id === reqBody.entryId).times;
  times = createTimes(times, reqBody.times);
}

function deleteEntry(data, reqBody) {
  data.entries.splice(
    data.entries.map((entry) => entry.id).indexOf(reqBody.entryId),
    1
  );
}

function deleteTime(data, reqBody) {
  let entry = data.entries.find((entry) => entry.id === reqBody.entryId);
  entry.times.splice(
    entry.times.map((time) => time.id).indexOf(reqBody.timeId),
    1
  );
  if (entry.times.length === 0 && !entry.favorite) {
    deleteEntry(data, reqBody);
  }
}

function patchEntry(data, reqBody) {
  const tags = new Map(data.tags.map((tag) => [tag.name, tag.id]));
  let entry = data.entries.find((entry) => entry.id === reqBody.entryId);
  entry.description = reqBody.description || entry.description;
  entry.tag = tags.get(reqBody.tag) || entry.tag;
  entry.defaultDuration = reqBody.defaultDuration || entry.defaultDuration;
  entry.favorite =
    reqBody.favorite === undefined ? entry.favorite : reqBody.favorite;
  if (entry.times.length === 0 && !entry.favorite) {
    deleteEntry(data, reqBody);
  }
}

function patchTime(data, reqBody) {
  let entry = data.entries.find((entry) => entry.id === reqBody.entryId);
  let time = entry.times.find((time) => time.id === reqBody.timeId);
  time.changed = Date.now();
  time.date = reqBody.date || time.date;
  time.duration = reqBody.duration || time.duration;
  time.status = reqBody.status || time.status;
}
