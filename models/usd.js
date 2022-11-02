const mongoose = require("mongoose");
const usdSchema = mongoose.Schema({
  usd: {
    type: Number,
  },
  type: {
    type: String,
  },
});
const Usd = mongoose.model("Usd", usdSchema);
module.exports = Usd;
