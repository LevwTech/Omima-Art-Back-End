const axios = require("axios");
const fs = require("fs");

const currencyApiKey = process.env.CURRENCY_API_KEY;
const getEGPToUSD = async () => {
  console.log("1 minute has passed..");
  try {
    const result = await axios.get(
      `https://api.apilayer.com/currency_data/convert?to=EGP&from=USD&amount=1&apikey=${currencyApiKey}`
    );
    const USDToEGP = Math.round(result.data.result);
    console.log(USDToEGP);

    const newUSDToEGP = {
      usd: USDToEGP,
    };
    const jsonString = JSON.stringify(newUSDToEGP);

    fs.writeFile("./utils/usd.json", jsonString, (err) => {
      if (err) {
        console.log("Error writing file", err);
      } else {
        console.log("Successfully updated USD to EGP");
      }
    });
  } catch (e) {
    console.log(e);
  }
};

module.exports = getEGPToUSD;
