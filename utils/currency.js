const axios = require("axios");
const Usd = require("../models/usd");

const currencyApiKey = process.env.CURRENCY_API_KEY;
const currencyURL = `https://api.apilayer.com/currency_data/convert?to=EGP&from=USD&amount=1&apikey=${currencyApiKey}`;
const getEGPToUSD = async () => {
  try {
    const usd = await Usd.findOne({ type: "USD" });
    if (!usd) {
      const result = await axios.get(currencyURL);
      const USDToEGP = Math.round(result.data.result);
      const firstUSD = new Usd({ type: "USD", usd: USDToEGP });
      await firstUSD.save();
    }
    const result = await axios.get(currencyURL);
    const USDToEGP = Math.round(result.data.result);

    const USDUpdate = await Usd.findOneAndUpdate(
      { type: "USD" },
      {
        usd: USDToEGP,
      }
    );
  } catch (e) {
    console.log(e);
  }
};

const getUSD = async () => {
  const usd = await Usd.findOne({ type: "USD" });
  if (!usd) {
    const result = await axios.get(currencyURL);
    const USDToEGP = Math.round(result.data.result);
    const firstUSD = new Usd({ type: "USD", usd: USDToEGP });
    await firstUSD.save();
    return Number(USDToEGP);
  }
  return Number(usd.usd);
};

module.exports = { getEGPToUSD, getUSD };
