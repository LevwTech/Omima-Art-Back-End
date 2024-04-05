const express = require("express");
const Product = require("../models/product");
const axios = require("axios");
const { sendNewOrderMail, sendThankYouOrderMail } = require("../mail/mail.js");
const hmacSHA512 = require("crypto-js/hmac-sha512");
const { getUSD, getEGPToUSD } = require("../utils/currency");
const { sendActiveMail } = require("../mail/mail.js");
const Usd = require("../models/usd");

// payment route:  first api takes key (acc unique) gives token to be used in 2nd api
// 2nd api gives id to be used in 3rd api as order_id along with also token
// 3rd api takes integration_id (acc unique) and gives token to be used in iframe

const router = new express.Router();

router.post("/payment", async (req, res) => {
  const USD = await getUSD();
  const data1 = await axios.post("https://accept.paymob.com/api/auth/tokens", {
    api_key: process.env.PAYMOB_API_KEY,
  });

  const token = data1.data.token;

  const obj2 = {
    auth_token: token,
    delivery_needed: "false",
    amount_cents: String(req.body.items.price * USD * 100),
    currency: "EGP",
    items: [
      {
        name: req.body.items.title,
        amount_cents: String(req.body.items.price * USD * 100),
        description: req.body.items.desc,
        quantity: "1",
      },
    ],
  };

  const data2 = await axios.post(
    "https://accept.paymob.com/api/ecommerce/orders",
    obj2
  );

  const id = data2.data.id;
  const obj3 = {
    auth_token: token,
    amount_cents: String(req.body.items.price * USD * 100),
    expiration: 3600,
    order_id: id,
    billing_data: {
      apartment: "NA",
      email: req.body.user.email,
      floor: "NA",
      first_name: req.body.user.name,
      street: req.body.shipping.adress,
      building: "NA",
      phone_number: req.body.shipping.phone,
      shipping_method: "NA",
      postal_code: "NA",
      city: req.body.shipping.city,
      country: req.body.shipping.country,
      last_name: req.body.user.sub, // saving the owner (sub) in the last_name field while the first_name holds the full name
      state: "NA",
    },
    currency: "EGP",
    integration_id: process.env.PAYMOB_INTEGRATION_ID,
  };

  try {
    const data3 = await axios.post(
      "https://accept.paymob.com/api/acceptance/payment_keys",
      obj3
    );

    res.send({ token: data3.data.token });
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

// callbacks

router.get("/callback", async (req, res) => {
  const HMACStringKeys = [
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "order", // instead of order.id
    "owner",
    "pending",
    "source_data.pan",
    "source_data.sub_type",
    "source_data.type",
    "success",
  ];
  const hmmacArr = [];
  HMACStringKeys.forEach((x) => hmmacArr.push(req.query[`${x}`]));
  const hmacString = "".concat(...hmmacArr);
  const hmacStringHashed = hmacSHA512(
    hmacString,
    process.env.PAYMOB_HMAC
  ).toString();
  const isHmacSecured = hmacStringHashed === req.query.hmac;
  if (req.query.success === "true" && isHmacSecured)
    res
      .writeHead(301, {
        Location: `${process.env.CLIENT_URL}/#/paymentsuccessful`,
      })
      .end();
  else
    res
      .writeHead(301, {
        Location: `${process.env.CLIENT_URL}/#/paymentfailed`,
      })
      .end();
});
router.post("/callback", async (req, res) => {
  const hmacString = "".concat(
    req.body.obj.amount_cents,
    req.body.obj.created_at,
    req.body.obj.currency,
    req.body.obj.error_occured,
    req.body.obj.has_parent_transaction,
    req.body.obj.id,
    req.body.obj.integration_id,
    req.body.obj.is_3d_secure,
    req.body.obj.is_auth,
    req.body.obj.is_capture,
    req.body.obj.is_refunded,
    req.body.obj.is_standalone_payment,
    req.body.obj.is_voided,
    req.body.obj.order.id,
    req.body.obj.owner,
    req.body.obj.pending,
    req.body.obj.source_data.pan,
    req.body.obj.source_data.sub_type,
    req.body.obj.source_data.type,
    req.body.obj.success
  );
  const hmacStringHashed = hmacSHA512(
    hmacString,
    process.env.PAYMOB_HMAC
  ).toString();
  const isHmacSecured = hmacStringHashed === req.query.hmac;
  if (req.body.obj.order && req.body.obj.success === true && isHmacSecured) {
    const painting = await Product.findOneAndUpdate(
      {
        title: req.body.obj.order.items[0].name,
      },
      {
        price: 0,
        owner: req.body.obj.order.shipping_data.last_name,
        userInfo: {
          name: req.body.obj.order.shipping_data.first_name,
          email: req.body.obj.order.shipping_data.email,
          phone: req.body.obj.order.shipping_data.phone_number,
          country: req.body.obj.order.shipping_data.country,
          city: req.body.obj.order.shipping_data.city,
          adress: req.body.obj.order.shipping_data.street,
        },
      }
    );
    sendNewOrderMail();
    sendThankYouOrderMail(req.body.obj.order.shipping_data.email);
  }

  res.send();
});

router.get("/shippingfees/:price&:country", async (req, res) => {
  const USD = await getUSD();
  let newPrice;
  if (req.params.country === process.env.ARTIST_COUNTRY)
    newPrice = Number(req.params.price) + Math.round(process.env.SHIPPING_FEES_ORIGIN_COUNTRY / USD);
  else newPrice = Number(req.params.price) + Math.round(process.env.SHIPPING_FEES_WORLDWIDE / USD);
  res.send({ newPrice: Math.round(newPrice), usd: USD });
});

// remove on buying a new hosting droplet
router.get("/boot", async (req, res) => {
  console.log("Server & DB Waking Up..");
  const painting = await Product.findOne({});
  res.send();
});

router.post("/updateUSD", async (req, res) => {
  await getEGPToUSD();
  res.send();
});
router.post("/keepSendgridActive", async (req, res) => {
  await sendActiveMail();
  res.send();
});

module.exports = router;
