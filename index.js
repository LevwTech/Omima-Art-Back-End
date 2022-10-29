require("./db/mongoose");
const express = require("express");
const cors = require("cors");
const path = require("path");
const { sendActiveMail } = require("./mail/mail.js");
const cron = require("node-cron");
const app = express();
const productRouter = require("./routers/product");
const exhibitionRouter = require("./routers/exhibition");
const paymentRouter = require("./routers/payment");
const getEGPToUSD = require("./utils/currency");
app.use(cors({ origin: "*" }));
process.env.PWD = process.cwd();
app.use(express.static("uploads")); // serving images folder publicly
app.use(express.static(path.join(process.env.PWD, "uploads")));
app.use(express.json());
app.use(productRouter);
app.use(exhibitionRouter);
app.use(paymentRouter);

// crontab scheduled on Sundays to keep sendgrid active
cron.schedule("0 0 * * 0", () => {
  sendActiveMail();
});
// Update USD to EGP latest currency convertion once a day
cron.schedule("0 1 * * *", () => {
  getEGPToUSD();
});

app.listen(process.env.PORT, () => {
  console.log(`server started on port ${process.env.PORT}`);
});
