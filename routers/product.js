const express = require("express");
const Product = require("../models/product");
const multer = require("multer");
const uploadFile = require("../utils/s3Upload");
const { usd } = require("./usd.json");
const USD = Number(usd);

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
  if (req.body.password === process.env.ADMIN_PW) {
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
  } else {
    res.status(400).send("Incorrect Password");
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
    .limit(10)
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

// Get  Collection
router.get("/collection", async (req, res) => {
  const products = await Product.find({ owner: req.query.owner });
  if (products) {
    res.status(200).send(products);
  } else {
    res.status(400).send("not found");
  }
});

// Delete Painting
router.get("/delete/:id&:password", async (req, res) => {
  if (req.params.password === process.env.ADMIN_PW) {
    try {
      const painting = await Product.findByIdAndDelete(req.params.id);
      res.status(200).send(`deleted`);
    } catch (e) {
      res.status(400).send(e);
    }
  } else {
    res.status(400).send("Incorrect Password");
  }
});

// Make Painting Sold
router.get("/sold/:id&:password", async (req, res) => {
  if (req.params.password === process.env.ADMIN_PW) {
    try {
      const painting = await Product.findByIdAndUpdate(req.params.id, {
        price: 0,
        owner: "google-oauth2|10671648352318424828",
        userInfo: {
          name: "Abdelrahman Mostafa",
          email: "Abdelraahmanmostafa@gmail.com",
          phone: "+2001145380005",
          country: "Egypt",
          city: "Sharm El Shiekh",
          adress:
            "Hay el Salam Building 13 Appart 6 Hay el Salam Building 13 Appart 6 Hay el Salam ",
        },
      });
      res.status(200).send(`Sold`);
    } catch (e) {
      res.status(400).send(e);
    }
  } else {
    res.status(400).send("Incorrect Password");
  }
});

router.get("/price/:id&:newPrice&:password", async (req, res) => {
  if (req.params.password === process.env.ADMIN_PW) {
    try {
      const painting = await Product.findByIdAndUpdate(req.params.id, {
        price: req.params.newPrice,
      });
      res.status(200).send(`Price Changed!`);
    } catch (e) {
      res.status(400).send(e);
    }
  } else {
    res.status(400).send("Incorrect Password");
  }
});

router.get("/shippingfees/:price&:country", async (req, res) => {
  let newPrice;
  if (req.params.country === "Egypt")
    newPrice = Number(req.params.price) + Math.round(100 / USD);
  else newPrice = Number(req.params.price) + Math.round(4000 / USD);
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

module.exports = router;
