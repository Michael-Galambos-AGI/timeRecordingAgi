const express = require("express")
let time = require(`${__dirname}/user.json`)

app = express(),
port = process.env.PORT || 3000;

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.get("/user", (req, res) => {
  res.status(200).json(time);
});
app.put("/put", (req, res) => {
  res.json({ message: "Hello World, from express" });
});
app.post("/post", (req, res) => {
  res.json({ message: "Hello World, from express" });
});
app.delete("/delete", (req, res) => {
  res.json({ message: "Hello World, from express" });
});
app.patch("/patch", (req, res) => {
  res.json({ message: "Hello World, from express" });
});

app.listen(port, () => {
  console.log("Server started on: " + port);
});
