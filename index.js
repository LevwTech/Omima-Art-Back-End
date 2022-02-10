require("./db/mongoose");
const express = require("express");
const cors = require("cors");
const productRouter = require("./routers/product");
const app = express();
app.use(cors());
app.use(express.json());
// app.use(productRouter);  // error here for some reason

app.listen(process.env.PORT, () => {
  console.log("server started on port 3000");
});
