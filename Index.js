const express = require("express");
const app = express();
const path = require("path");
const port = 8080;

app.use(express.static("webapp"));

app.listen(port, () =>
  console.log(`Server started at http://localhost:${port}`)
);
