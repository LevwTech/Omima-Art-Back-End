require("./db/mongoose");
const express = require("express");
const cors = require("cors");
const app = express();
const productRouter = require("./routers/product");
const exhibitionRouter = require("./routers/exhibition");
const mailRouter = require("./routers/mail");
app.use(cors());
app.use(express.static("uploads")); // serving images folder publicly
app.use(express.json());
app.use(productRouter);
app.use(exhibitionRouter);

app.listen(process.env.PORT, () => {
  console.log(`server started on port ${process.env.PORT}`);
});
