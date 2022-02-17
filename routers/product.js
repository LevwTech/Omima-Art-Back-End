const express = require("express");
const Product = require("../models/product");
const multer = require("multer");
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
    if (!file.originalname.match(/\.(jpe?g|png|gif|bmp)$/)) {
      return cb(new Error("File must be an Image")); //
    }
    cb(undefined, true);
  },
});

const router = new express.Router();

// Post Painting Route
router.post("/painting", upload.array("images"), async (req, res) => {
  const images = [];
  // to get an image >> http://localhost:3000/image.png
  // str.split("\\").pop()
  for (const image of req.files) {
    images.push(image.path);
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
          url: `https://omimaart.herokuapp.com/${image.split("/").pop()}`,
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

module.exports = router;
