const express = require("express");
const Exhibition = require("../models/exhibition");
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

// Post Exhibition Route
router.post("/exhibition", upload.array("exhibitions"), async (req, res) => {
  const images = [];

  for (const image of req.files) {
    images.push(image.path);
  }
  const painting = new Exhibition({ ...req.body, images });
  try {
    await painting.save();
    res.status(201).send("Exhibition Added!");
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get Exhibitions Route
router.get("/exhibitions", async (req, res) => {
  const exhibitions = await Exhibition.find({});

  if (exhibitions) {
    res.status(200).send(exhibitions);
  } else {
    res.status(400).send("not found");
  }
});

// Get Exhibition Route
router.get("/exhibition/:id", async (req, res) => {
  try {
    const exhibition = await Exhibition.findOne({ _id: req.params.id });
    if (exhibition) {
      const newExhibition = {
        title: exhibition.title,
        desc: exhibition.desc,
        price: exhibition.price,
        id: exhibition._id,
        images: [],
      };
      for (const image of exhibition.images) {
        newExhibition.images.push({
          url: `http://localhost:3000/${image.split("\\").pop()}`,
        });
      }
      res.status(200).send(newExhibition);
    } else {
      res.status(400).send("not found");
    }
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
