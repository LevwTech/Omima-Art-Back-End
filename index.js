require("./db/mongoose");
const express = require("express");
const cors = require("cors");
const path = require("path");
const { sendActiveMail } = require("./mail/mail.js");
const cron = require("node-cron");
const app = express();
const productRouter = require("./routers/product");
const exhibitionRouter = require("./routers/exhibition");
app.use(cors({ origin: "*" }));
process.env.PWD = process.cwd();
app.use(express.static("uploads")); // serving images folder publicly
app.use(express.static(path.join(process.env.PWD, "uploads")));
app.use(express.json());
app.use(productRouter);
app.use(exhibitionRouter);

// crontab scheduled on Sundays to keep sendgrid active
cron.schedule("0 0 * * 0", () => {
  sendActiveMail();
});

app.listen(process.env.PORT, () => {
  console.log(`server started on port ${process.env.PORT}`);
});
