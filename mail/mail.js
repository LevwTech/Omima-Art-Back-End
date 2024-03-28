const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendNewOrderMail() {
  const msg = {
    to: process.env.ARTIST_EMAIL,
    from: process.env.SENDGRID_VERIFIED_SENDER,
    subject: `New Order ${process.env.ARTIST_FIRST_NAME} Art`,
    text: "New Painting has been purchased! check (Admin > New Orders) for User and Shipping Info",
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log("Email Sent");
    })
    .catch((error) => {
      console.error(error);
    });
}
function sendThankYouOrderMail(email) {
  const msg = {
    to: email, //  recipient
    from: process.env.ARTIST_EMAIL, // verified sender
    subject: `Thank you for Purchasing from ${process.env.ARTIST_FIRST_NAME} Art Gallery`,
    text: "Your painting will be shipped and delivered to you. An email that includes the tracking number and other details will be sent to you shortly.",
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
    to: "leevvw@gmail.com", //  Any Email
    from: process.env.SENDGRID_VERIFIED_SENDER,
    subject: "This is to keep SendGrid Active",
    text: "Ignore this email",
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log("Email Sent");
    })
    .catch((error) => {
      console.error(error);
    });
}

module.exports = { sendNewOrderMail, sendThankYouOrderMail, sendActiveMail };
