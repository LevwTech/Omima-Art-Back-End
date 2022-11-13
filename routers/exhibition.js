const express = require("express");
const Exhibition = require("../models/exhibition");
const upload = require("../utils/uploadS3");

const router = new express.Router();

// Post Exhibition Route
router.post("/exhibition", upload.array("exhibitions"), async (req, res) => {
  if (req.body.password === process.env.ADMIN_PW) {
    const images = [];
    for (const image of req.files) {
      images.push(`https://omima-art-images.s3.amazonaws.com/${image.key}`);
    }
    const painting = new Exhibition({ ...req.body, images });
    try {
      await painting.save();
      res.status(201).send("Exhibition Added!");
    } catch (e) {
      res.status(400).send(e);
    }
  } else {
    res.status(400).send("Incorrect Password");
  }
});

// Get Exhibitions Route
router.get("/exhibitions", async (req, res) => {
  const exhibitions = await Exhibition.find({})
    .skip(Number(req.query.skip))
    .limit(10)
    .sort({ createdAt: -1 });
  const maxChars = 100;
  if (exhibitions) {
    exhibitions.forEach((exhibiton) => {
      exhibiton.desc =
        exhibiton.desc.split("").slice(0, maxChars).join("") + "...";
    });
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
          url: image,
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
// Delete Exhibition
router.get("/Edelete/:id&:password", async (req, res) => {
  if (req.params.password === process.env.ADMIN_PW) {
    try {
      const exhibition = await Exhibition.findByIdAndDelete(req.params.id);
      res.status(200).send(`deleted`);
    } catch (e) {
      res.status(400).send(e);
    }
  } else {
    res.status(400).send("Incorrect Password");
  }
});

module.exports = router;
