const express = require("express");
const cors = require("cors");
const moment = require("moment");
const partner = require("./routes/partner");
const admin = require("./routes/admin");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const nodemailer = require("nodemailer");
dotenv.config();
connectDB();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("./models/user");
// const Payment = require("./models/payment");
const path = require("path");
const logoPath = path.join(__dirname, "assets/logo.jpg");
const mailIconPath = path.join(__dirname, "assets/mail.png");
const logoCid = "companyLogo";
const mailIconCid = "mailIcon";

const app = express();

app.use(cors());

const { SMTP_EMAIL, SMTP_PASS } = process.env;

let transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: SMTP_EMAIL,
    pass: SMTP_PASS,
  },
});

let endpointSecret;

endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let data;
    let event;

    if (endpointSecret) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log("Webhook verified.");
      } catch (err) {
        console.log(`Webhook Error: ${err.message}`);
        console.error("Webhook signature verification failed.", err);
        res.status(400).send("Webhook Error: " + err.message);
        return;
      }
      data = event.data.object;
      eventType = event.type;
    } else {
      data = req.body.data.object;
      eventType = req.body.type;
    }
    if (eventType === "checkout.session.completed") {
      try {
        const customer = await stripe.customers.retrieve(data.customer);
        let carePurchaseDate = moment().format("DD/MM/YYYY HH:mm:ss");

        const userId = customer.metadata.userId;
        const alldata = await User.findOne({ 'services._id': userId });
        const service = alldata.services.id(userId)
        const careExpireTimeline = service.careExpireTimeline;

        let expiryTimeline = 1;
        switch (careExpireTimeline) {
          case "1 Hour":
            expiryTimeline = 1 / 24;
            break;
          case "3 Hours":
            expiryTimeline = 3 / 24;
            break;
          case "6 Hours":
            expiryTimeline = 6 / 24;
            break;
          case "12 Hours":
            expiryTimeline = 12 / 24;
            break;
          case "24 Hours":
            expiryTimeline = 1;
            break;
          case "2 Days":
            expiryTimeline = 2;
            break;
          case "Till 6 Months":
            expiryTimeline = 6 * 30;
            break;
          case "1 Year":
            expiryTimeline = 365;
            break;
          default:
            console.error(
              "Invalid careExpireTimeline value:",
              careExpireTimeline
            );
            break;
        }

        let careExpiryDate = moment(carePurchaseDate, "DD/MM/YYYY HH:mm:ss")
          .add(expiryTimeline, "days")
          .format("DD/MM/YYYY HH:mm:ss");



        // await Payment.findOneAndUpdate(
        //   { paymentId: data.id },
        //   {
        //     paymentIntent: data.payment_intent,
        //     careExpiryDate: careExpiryDate,
        //     carePurchaseDate: carePurchaseDate,
        //     paymentStatus: data.payment_status,
        //   }
        // );

        if (data.payment_status === "paid") {
          let payment = service.payments.find(payment => payment.customerId === customer.id);
          // console.log(customer.id)
          // console.log(payment)
          if (payment) {
            const user = await User.findOne({ _id: alldata._id });
            const serviceIndex = user.services.findIndex(service => service._id.toString() === userId);
            const paymentIndex = user.services[serviceIndex].payments.findIndex(p => p.customerId === payment.customerId);
            const value = await User.findOneAndUpdate(
              { _id: alldata._id },
              {
                [`services.${serviceIndex}.payments.${paymentIndex}.paymentIntent`]: data.payment_intent,
                [`services.${serviceIndex}.payments.${paymentIndex}.careExpiryDate`]: careExpiryDate,
                [`services.${serviceIndex}.payments.${paymentIndex}.carePurchaseDate`]: carePurchaseDate,
                [`services.${serviceIndex}.payments.${paymentIndex}.paymentStatus`]: data.payment_status
              },
              { new: true }
            );
          }
          const mailOptions = {
            from: SMTP_EMAIL,
            to: alldata.email,
            subject: "GadCare Payment Confirmation",
            html: `<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9;">
          <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.1); max-width: 600px; margin: 0 auto;">
           <tr>
                  <td align="center">
                      <div style="margin-top: 10px;">
                        <img src="cid:companyLogo" alt="Company Logo" style="max-width: 200px;">
                      </div>
                  </td>
              </tr>
              <tr>
                  <td>
                      <h3 style="color: #0066cc; font-size: 26px; text-align: center; margin-bottom: 20px;">Welcome to GadCare</h3>
                      <hr style="border: 1px solid #ccc; margin: 20px 0;">
                      <h4 style="font-size: 22px; color: #333; text-align: center;">Your care cover has been activated</h4>
                      <p style="font-size: 18px; color: #333; margin: 20px 0; text-align: center;">You're all set! Now you can easily manage your user dashboard by logging in with your account details provided below. You can also download your channel partner agreement after logging in.</p>
                      <p style="font-size: 18px; color: #0066cc; text-align: center;">${service.type} Service Care partner</p>
                  <p style="font-size: 18px; text-align: center;">${service.careFees
                ? `<strong>Care Fees Paid:</strong> ${service.careFees} ${service.currency}`
                : ""
              }</p>
                  <p style="font-size: 18px; text-align: center;">${service.familyMembers && service.familyMembers.length
                ? `<strong>Family Members:</strong> ${service.familyMembers.length}`
                : ""
              }</p>
                  <p style="font-size: 18px; text-align: center;">${service.careValueAmount
                ? `<strong>Care Value of Product:</strong> ${service.careValueAmount} ${service.currency}`
                : ""
              }</p>
                  <p style="font-size: 18px; text-align: center;">${service.billValue
                ? `<strong>Product Bill Value:</strong> ${service.billValue} ${service.currency}`
                : ""
              }</p>
                  <p style="font-size: 18px; text-align: center;">${service.carePurchaseDate
                ? `<strong>Plan Purchased on:</strong> ${service.carePurchaseDate}`
                : ""
              }</p>
                  <p style="font-size: 18px; text-align: center;">${service.careExpiryDate
                ? `<strong>Plan Expires on:</strong> ${service.careExpiryDate}`
                : ""
              }</p>
                  </td>
              </tr>
              <tr>
                  <td align="center">
                      <div style="margin-top: 30px;">
                          <img src="cid:mailIcon" alt="Mail Icon" style="max-width: 20px; margin-right: 5px;">
                          <span style="font-size: 18px; color: #333;">partner@gadcare.com</span>
                      </div>
                      <div style="margin-top: 20px;">
                          <h5 style="font-size: 20px; margin: 5px 0; color: #333;">Best Regards,</h5>
                          <h5 style="font-size: 20px; margin: 5px 0; color: #333;">GadCare Team</h5>
                      </div>
                  </td>
              </tr>
          </table>
        </body>`,
            attachments: [
              {
                filename: "logo.jpg",
                path: logoPath,
                cid: logoCid,
              },
              {
                filename: "mail.png",
                path: mailIconPath,
                cid: mailIconCid,
              },
            ],
          };

          transporter
            .sendMail(mailOptions)
            .then(() => {
              console.log("Mail sent to the user");
            })
            .catch((err) => {
              console.log(err);
              return 0;
            });
        }
      } catch (err) {
        console.error("Error retrieving customer details:", err);
      }
    }

    res.send().end();
  }
);

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Server up and running");
});

app.use("/api", partner);
app.use("/admin", admin);

app.listen(process.env.PORT, () =>
  console.log(`SERVER UP and running at ${process.env.PORT}`)
);
