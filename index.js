require("./db/mongoose");
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const productRouter = require("./routers/product");
const exhibitionRouter = require("./routers/exhibition");
app.use(cors({ origin: "https://omima.art" }));
app.set("Access-Control-Allow-Origin", "https://omima.art");
process.env.PWD = process.cwd();
app.use(express.static("uploads")); // serving images folder publicly
app.use(express.static(path.join(process.env.PWD, "uploads")));
app.use(express.json());
app.use(productRouter);
app.use(exhibitionRouter);

app.listen(process.env.PORT, () => {
  console.log(`server started on port ${process.env.PORT}`);
});
