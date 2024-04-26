const Saveuser = require("./user");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcrypt");
const ref = require('./ref')
const User = require("../models/user");
const servicedata = require('../models/services')
const Payment = require("../models/payment");
const upload = require("../middleware/multer");
const user = require("../models/user");
const msg = require("../models/messages");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const { SMTP_EMAIL, SMTP_PASS, TOKEN_KEY } = process.env;

let transporter = nodemailer.createTransport({
  host: 'fixtechcare.com',
  port: 465,
  secure: true,
  auth: {
    user: SMTP_EMAIL,
    pass: SMTP_PASS,
  },
})

const recaptcha_key = process.env.RECAPTCHA_SECRET_KEY;


app.post(
  "/register",
  upload.fields([
    { name: "invoice", maxCount: 1 },
    { name: "pictures", maxCount: 6 },
    { name: "selfie", maxCount: 1 },
    { name: "eventInvite", maxCount: 2 },
    { name: "establishmentPictures", maxCount: 4 },
    { name: "registrationDetails", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        email,
        password,
        fName,
        mName,
        lName,
        contact,
        country,
        city,
        state,
        zip,
        recaptchaToken,
        services
      } = req.body;

      if (
        !country ||
        !email ||
        !password ||
        !fName ||
        !lName ||
        // !category ||
        !contact ||
        !recaptchaToken
      )
        return res
          .status(400)
          .json({ error: "Enter all the mandatory fields correctly" });

      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${recaptcha_key}&response=${recaptchaToken}`
      );

      if (!response.data.success) {
        return res.status(400).json({ error: "reCAPTCHA verification failed" });
      }

      // if (!req.files || Object.keys(req.files).length === 0) {
      //   console.log('No files.');
      // } else {
      //   console.log('File exists');
      // }


      const hashedPassword = await bcrypt.hash(password, 10);
      const invoiceUpload = req.files && req.files["invoice"]
        ? await cloudinary.uploader.upload(req.files["invoice"][0].path)
        : null;
      const picturesUpload = req.files && req.files["pictures"]
        ? await Promise.all(
          req.files["pictures"].map((file) =>
            cloudinary.uploader.upload(file.path)
          )
        )
        : [];
      const selfieUpload = req.files && req.files["selfie"]
        ? await cloudinary.uploader.upload(req.files["selfie"][0].path)
        : null;
      const eventInviteUpload = req.files && req.files["eventInvite"]
        ? await cloudinary.uploader.upload(req.files["eventInvite"][0].path)
        : null;
      const establishmentPicturesUpload = req.files && req.files["establishmentPictures"]
        ? await Promise.all(
          req.files["establishmentPictures"].map((file) =>
            cloudinary.uploader.upload(file.path)
          )
        )
        : [];
      const registrationDetailsUpload = req.files && req.files["registrationDetails"]
        ? await cloudinary.uploader.upload(
          req.files["registrationDetails"][0].path
        )
        : null;
      // console.log(invoiceUpload)
      const refcode = await ref.gencode()
      const newUser = {
        email,
        password: hashedPassword,
        fName,
        mName,
        lName,
        contact,
        country,
        city,
        state,
        zip,
        refcode,
        services: [{
          type: services[0].type,
          category: services[0].category,
          productCondition: services[0].productCondition,
          oldPurchaseOption: services[0].oldPurchaseOption,
          itinerary: services[0].itinerary,
          careFor: services[0].careFor,
          referralCode: services[0].referralCode,
          careFees: services[0].careFees,
          travelTimeline: services[0].travelTimeline,
          familyMembers: services[0].familyMembers,
          selfie: selfieUpload ? selfieUpload.secure_url : services[0].selfie,
          eventDetails: services[0].eventDetails,
          eventDays: services[0].eventDays,
          expectedAttendees: services[0].expectedAttendees,
          eventVenue: services[0].eventVenue,
          emergencyContact: services[0].emergencyContact,
          eventInvite: eventInviteUpload ? eventInviteUpload.secure_url : services[0].eventInvite,
          brandName: services[0].brandName,
          establishmentName: services[0].establishmentName,
          currency: services[0].currency,
          careValueAmount: services[0].careValueAmount,
          areaInSqft: services[0].areaInSqft,
          establishmentDetails: services[0].establishmentDetails,
          operationDetails: services[0].operationDetails,
          establishmentPictures: establishmentPicturesUpload ? establishmentPicturesUpload.map((result) => result.secure_url) : services[0].establishmentPictures,
          registrationDetails: registrationDetailsUpload ? registrationDetailsUpload.secure_url : services[0].registrationDetails,
          billValue: services[0].billValue,
          productPurchaseDate: services[0].productPurchaseDate,
          careExpireTimeline: services[0].careExpireTimeline,
          carePurchaseDate: services[0].carePurchaseDate,
          careExpiryDate: services[0].careExpiryDate,
          invoice: invoiceUpload ? invoiceUpload.secure_url : services[0].invoice,
          pictures: picturesUpload ? picturesUpload.map((result) => result.secure_url) : services[0].pictures,
          serialNo: services[0].serialNo
        }]
      }
      const saving = await servicedata.create(
        newUser.services
      )
      const emailCheck = await User.findOne({ email });
      if (emailCheck) {
        const NewData = await User.findOneAndUpdate(
          { email: email },
          {
            $push: {
              services: newUser.services
            }
          },
          { new: true }
        );
        // console.log(services[0].careValueAmount)
        // console.log(newUser)
        // console.log(NewData)
        return res.status(200).json({
          msg: "Email already used so data added to existing user info",
          // user: NewData,
          status: true,
        });
      }
      Saveuser.registerUser(newUser, newUser.services)
        .then((data) => {
          res.status(200).json({
            msg: "Successfully registered. Check your email for further process",
            user: data,
            status: true,
          });
        })
        .catch((error) => {
          console.error(error);
          res.status(400).json({ error: "Error registering the user" });
        });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: "Error registering the user" });
    }
  }
);

app.get("/logout", async (req, res) => {
  try {
    res.clearCookie('jwt')
    res.status(200).send("User Logged out and session ended")
  } catch (ex) {
    next(ex)
  }
})

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ userId: user._id }, TOKEN_KEY, { expiresIn: "24h" });
    res.cookie('jwt', token, {
      secure: true,
      maxAge: 2 * 60 * 60 * 1000,
      httpOnly: true
    })
    res.cookie({ token })
    res.json({ token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/resetpass', async (req, res) => {
  try {
    const { email, newPass, confirmPass } = req.body
    if (newPass != confirmPass)
      return res.status(400).json({ msg: "The passwords does not match" })
    const data = await user.findOne({ email })
    console.log(data)
    const hashedPassword = await bcrypt.hash(newPass, 10);
    data.password = hashedPassword
    data.save()
    return res.status(200).json({ msg: "Password updated successfully" })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ msg: "Internal Server occured" })
  }
})

app.get("/user", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // if(user.payments.length===0)
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    let { currency, careFees, userId } = req.body;

    const data = await User.findOne({ 'services._id': userId });
    const service = data.services.id(userId);

    const customer = await stripe.customers.create({
      metadata: {
        userId: service.id.toString(),
      }
    })
    careFees *= 100;
    careFees = parseFloat(careFees.toFixed(2));
    console.log(careFees)
    const lineItem = {
      price_data: {
        currency: currency,
        unit_amount: careFees,
        product_data: {
          name: "Care Fees",
        },
      },
      quantity: 1,
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [lineItem],
      customer: customer.id,
      mode: "payment",
      success_url: "http://localhost:3000/user/success",
      cancel_url: "http://localhost:3000/user/cancel",
    });

    const payment = await Payment.create({
      customerId: customer.id,
      ServiceId: userId,
      carePurchaseDate: new Date(),
      careExpiryDate: new Date(),
      paymentId: session.id,
      paymentIntent: session.payment_intent,
      paymentStatus: "pending",
      totalAmount: careFees,
      currency: currency
    });

    const user = await User.findOneAndUpdate(
      { _id: data._id, 'services._id': userId },
      { $push: { 'services.$.payments': payment } },
      { new: true }
    );

    res.json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/sendmail', async (req, res) => {
  try {
    const { userMail, subject, type, description } = req.body
    if (!userMail || !subject || !type || !description)
      return res.status(400).json({ msg: "All the fields are necessary" })
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASS,
      }
    });

    let mailOptions = {
      // from: SMTP_EMAIL,
      to: 'partner@gadcare.com',
      subject: `Issue: ${subject} from ${userMail}`,
      text: `Type: ${type}\n\nDescription: ${description}\n`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    return res.status(200).json({ message: 'Mail sent' });
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Unexpected error occured try again!" })
  }
})

app.post('/claim', upload.fields([
  { name: "images", maxCount: 6 }
]), async (req, res) => {
  try {
    const { id, claim_type, accNum, accName, swiftCode, branchAdd, contactNum, amount } = req.body
    // console.log(req.body)
    // if (!req.files || Object.keys(req.files).length === 0) {
    //   console.log('No files.');
    // } else {
    //   console.log('File exists');
    // } 
    if (!id || !claim_type || !accNum || !accName || !swiftCode || !branchAdd || !contactNum || !amount)
      return res.status(400).json({ error: "You need to specify the mandatory fields" })
    const images = await Promise.all(req.files.images.map(file => cloudinary.uploader.upload(file.path)))
    const claim = {
      claim_type,
      accNum,
      bankName,
      accName,
      swiftCode,
      branchAdd,
      contactNum,
      images: images.map(image => image.url),
      amount
    }
    // console.log(claim)
    const update = await User.findByIdAndUpdate(
      id,
      { $push: { claims: claim } },
      { new: true, useFindAndModify: false }
    );
    if (!update)
      return res.status(404).json({ error: "Invalid user ID, no user found" });
    // console.log(update)
    return res.status(200).json({ msg: "claim raised successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "error raising claim" });
  }
})

app.post("/icon", upload.single('img'), async (req, res) => {
  try {
    const email = req.body.email
    const img = req.file.path;
    const cloudinaryResponse = await cloudinary.uploader.upload(img);
    const iconUrl = cloudinaryResponse.url;
    const updatedUser = await User.findOneAndUpdate({ email }, { icon: iconUrl }, { new: true });
    res.status(200).json({ msg: 'Icon updated', iconUrl: iconUrl });
  } catch (error) {
    console.error(error);
    res.status(400).json({ err: "Failed to update the icon" });
  }
})

app.post('/myclaims', async (req, res) => {
  try {
    const { email } = req.body
    const data = await User.findOne({ email })
    if (!data || data.claims == 0)
      return res.status(404).json({ msg: "No claim data found" });
    return res.status(200).json(data.claims);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "error fetching claim data" });
  }
});

app.get('/messages/:userId', async (req, res) => {
  try {
    let id = req.params.userId
    const userData = await user.findOne({ _id: id })
    userData.messages.sort((a, b) => b.receivedAt - a.receivedAt)
    console.log(userData.messages)
    if (!userData)
      return res.status(404).json({ msg: "No message found" })
    return res.status(200).json(userData.messages)
  } catch (error) {
    console.error(error)
    return res.status(404).json({ msg: "Error fetching data" })
  }
})

app.get('/earnings/:id', async (req, res) => {
  try {
    const id = req.params.id
    const earningData = await user.findById(id)
    // console.log(earningData.earning)
    return res.status(200).json(earningData.earning)
  } catch (error) {
    console.error(error)
  }
})

module.exports = app;
