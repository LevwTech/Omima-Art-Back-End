const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    desc: {
      type: String,
      required: true,
    },
    price: {
      // when a painting is sold make price = 0 and in frontend if price is 0 replace with SOLD
      type: Number,
      required: true,
      min: 0,
    },

    images: [
      {
        type: String,
        required: true,
      },
    ],
    owner: {
      type: String,
    },
    done: {
      type: Boolean,
      default: false,
      required: true;
    },
    userInfo: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      country: { type: String },
      city: { type: String },
      adress: { type: String },
    },
  },
  { timestamps: true, toJSON: { virtuals: true } } // adds createdAt and updatedAt fields
);
const Product = mongoose.model("Product", productSchema);
module.exports = Product;
