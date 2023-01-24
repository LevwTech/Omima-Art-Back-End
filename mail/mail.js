const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendNewOrderMail() {
  const msg = {
    to: "omimaaboelnasr@hotmail.com", // Change to your recipient
    from: "levwtech@gmail.com", // Change to your verified sender
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
    text: "Your painting will be shipped and delivered to you :) An email that includes the tracking number and other details will be sent to you shortly.",
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

async function sendActiveMail() {
  const msg = {
    to: "leevvw@gmail.com", //  recipient
    from: "levwtech@gmail.com", // verified sender
    subject: "This is to keep SendGrid Active",
    text: "Ignore this email",
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

module.exports = { sendNewOrderMail, sendThankYouOrderMail, sendActiveMail };
// import as: const { sendNewOrderMail, sendThankYouOrderMail } = require("./mail/mail.js");
