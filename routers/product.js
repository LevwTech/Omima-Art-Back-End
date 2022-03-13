const express = require("express");
const Product = require("../models/product");
const multer = require("multer");
const uploadFile = require("../utils/s3Upload");
const axios = require("axios");
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
    fileSize: 1024 * 1024 * 100, // only accept till 100 mbs
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
router.get("/paintings", async (req, res) => {
  const products = await Product.find({})
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
    newPrice = Number(req.params.price) + Math.round(100 / 15.75);
  else newPrice = Number(req.params.price) + Math.round(3000 / 15.75);
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
    amount_cents: String(Number(req.body.items.price) * 15.75 * 100),
    currency: "EGP",
    items: [
      {
        name: req.body.items.title,
        amount_cents: String(Number(req.body.items.price) * 15.75 * 100),
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
    amount_cents: String(req.body.items.price * 15.75 * 100),
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
  const data3 = await axios.post(
    "https://accept.paymob.com/api/acceptance/payment_keys",
    obj3
  );
  res.send({ token: data3.data.token });
});

module.exports = router;
