const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendNewOrderMail() {
  const msg = {
    to: "omimaaboelnasr@hotmail.com", // Change to your recipient
    from: "leevvw@gmail.com", // Change to your verified sender
    subject: "New Order Omima Art",
    text: "New Painting has been purchased! check (Admin > New Orders) for User and Shipping Info",
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error(error);
    });
}
function sendThankYouOrderMail(email) {
  const msg = {
    to: email, //  recipient
    from: "omimaaboelnasr@hotmail.com", // verified sender
    subject: "Thank you for Purchasing from Omima.art",
    text: "Your painting will be shipped and delivered to you :)",
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error(error);
    });
}

module.exports = { sendNewOrderMail, sendThankYouOrderMail };
// import as: const { sendNewOrderMail, sendThankYouOrderMail } = require("./mail/mail.js");
