const express = require("express");
const Product = require("../models/product");
const multer = require("multer");
const uploadFile = require("../utils/s3Upload");
const axios = require("axios");
const { sendNewOrderMail, sendThankYouOrderMail } = require("../mail/mail.js");
const hmacSHA512 = require("crypto-js/hmac-sha512");
const Base64 = require("crypto-js/enc-base64");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 100, // only accept  till 100  mbs
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpe?g|png|PNG|JPG|JPEG|gif|bmp)$/)) {
      return cb(new Error("File must be an Image")); //
    }
    cb(undefined, true);
  },
});

const router = new express.Router();

// Post Painting Route
router.post("/painting", upload.array("images"), async (req, res) => {
  console.log(req.body);
  const images = [];
  for (const image of req.files) {
    try {
      const result = await uploadFile(image);
      images.push(result.Location);
    } catch (e) {
      res.send(e);
    }
  }
  const painting = new Product({ ...req.body, images });
  try {
    await painting.save();
    res.status(201).send("Painting Added!");
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get Paintings Route

// Floral
router.get("/floral", async (req, res) => {
  const products = await Product.find({ category: "floral" })
    .skip(Number(req.query.skip))
    .limit(10)
    .sort({ createdAt: -1 });

  if (products) {
    res.status(200).send(products);
  } else {
    res.status(400).send("not found");
  }
});
// Landscape
router.get("/landscape", async (req, res) => {
  const products = await Product.find({ category: "landscape" })
    .skip(Number(req.query.skip))
    .limit(5)
    .sort({ createdAt: -1 });

  if (products) {
    res.status(200).send(products);
  } else {
    res.status(400).send("not found");
  }
});
// Abstract
router.get("/abstract", async (req, res) => {
  const products = await Product.find({ category: "abstract" })
    .skip(Number(req.query.skip))
    .limit(10)
    .sort({ createdAt: -1 });

  if (products) {
    res.status(200).send(products);
  } else {
    res.status(400).send("not found");
  }
});
// Paper
router.get("/paper", async (req, res) => {
  const products = await Product.find({ category: "paper" })
    .skip(Number(req.query.skip))
    .limit(10)
    .sort({ createdAt: -1 });

  if (products) {
    res.status(200).send(products);
  } else {
    res.status(400).send("not found");
  }
});

// Get Painting Route
router.get("/painting/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id });
    if (product) {
      const newProduct = {
        title: product.title,
        desc: product.desc,
        price: product.price,
        id: product._id,
        images: [],
      };
      for (const image of product.images) {
        newProduct.images.push({
          url: image,
        });
      }
      res.status(200).send(newProduct);
    } else {
      res.status(400).send("not found");
    }
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get Collection
router.get("/collection", async (req, res) => {
  const products = await Product.find({ owner: req.query.owner });
  if (products) {
    res.status(200).send(products);
  } else {
    res.status(400).send("not found");
  }
});

// Delete Painting
router.get("/delete/:id", async (req, res) => {
  try {
    const painting = await Product.findByIdAndDelete(req.params.id);
    res.status(200).send(`deleted`);
  } catch (e) {
    res.status(400).send(e);
  }
});
router.get("/price/:id&:newPrice", async (req, res) => {
  try {
    const painting = await Product.findByIdAndUpdate(req.params.id, {
      price: req.params.newPrice,
    });
    res.status(200).send(`Price Changed!`);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/shippingfees/:price&:country", async (req, res) => {
  let newPrice;
  if (req.params.country === "Egypt")
    newPrice = Number(req.params.price) + Math.round(100 / 18.5);
  else newPrice = Number(req.params.price) + Math.round(4000 / 18.5);
  res.send({ newPrice: Math.round(newPrice) });
});

// getting orders from admin panel
router.get("/orders", async (req, res) => {
  const orders = await Product.find({ price: 0, done: false });
  if (orders) {
    res.status(200).send(orders);
  } else {
    res.status(400).send("not found");
  }
});

// when mom clicks done on order
router.get("/done/:id", async (req, res) => {
  try {
    const order = await Product.findByIdAndUpdate(req.params.id, {
      done: true,
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

// getting previous orders from admin panel
router.get("/prevorders", async (req, res) => {
  const orders = await Product.find({ done: true }).sort({ updatedAt: -1 });
  if (orders) {
    res.status(200).send(orders);
  } else {
    res.status(400).send("not found");
  }
});

// payment route:  first api takes key (acc unique) gives token to be used in 2nd api
// 2nd api gives id to be used in 3rd api as order_id along with also token
// 3rd api takes integration_id (acc unique) and gives token to be used in iframe
router.post("/payment", async (req, res) => {
  const data1 = await axios.post("https://accept.paymob.com/api/auth/tokens", {
    api_key: process.env.PAYMOB_API_KEY,
  });

  const token = data1.data.token;

  const obj2 = {
    auth_token: token,
    delivery_needed: "false",
    amount_cents: String(req.body.items.price * 18.5 * 100),
    currency: "EGP",
    items: [
      {
        name: req.body.items.title,
        amount_cents: String(req.body.items.price * 18.5 * 100),
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
    amount_cents: String(req.body.items.price * 18.5 * 100),
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
      last_name: req.body.user.sub,
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

module.exports = router;
