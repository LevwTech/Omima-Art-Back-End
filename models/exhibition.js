const mongoose = require("mongoose");
const exhibitionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  desc: {
    type: String,
    required: true,
  },

  images: [
    {
      type: String,
      required: true,
    },
  ],
});
const Exhibition = mongoose.model("Exhibition", exhibitionSchema);
module.exports = Exhibition;
