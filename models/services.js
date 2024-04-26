const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "Gadgets",
      "Auto",
      "Furniture",
      "Travel",
      "Events",
      "Agriculture",
      "Manufacturing & Goods",
    ],
  },
  category: {
    type: String,
  },
  productCondition: {
    type: String,
    enum: ["New Purchase", "Old Purchase"],
  },
  oldPurchaseOption: {
    type: String,
    enum: ["1-2 years old", "2-3 years old", "More than 3 years old",""],
    default:""
  },
  itinerary: String,
  careFor: {
    type: String,
    enum: ["Self", "Family", "Everyone"],
  },
  travelTimeline: {
    type: String,
    enum: [
      "1 Hour",
      "3 Hours",
      "6 Hours",
      "12 Hours",
      "24 Hours",
      "2 Days",
      "Till 6 Months",
    ],
  },
  familyMembers: [
    {
      name: String,
      age: Number,
      sex: {
        type: String,
        enum: ["Male", "Female", "Other"],
      },
      nomineeDetails: String,
    },
  ],
  selfie: String,
  eventDetails: String,
  eventDays: Number,
  expectedAttendees: Number,
  eventVenue: [String],
  emergencyContact: Number,
  eventInvite: String,
  brandName: String,
  establishmentName: String,
  currency: {
    type: String,
  },
  careValueAmount: {
    type: Number,
  },
  referralCode: {
    type: String,
    min: 4,
    max: 10,
  },
  careFees: {
    type: Number,
    required: true,
  },
  areaInSqft: String,
  establishmentDetails: String,
  operationDetails: {
    type: String,
    maxlength: 200,
  },
  establishmentPictures: [String],
  registrationDetails: String,
  billValue: Number,
  productPurchaseDate: String,
  careExpireTimeline: {
    type: String,
  },
  careFees: {
    type: Number,
  },
  carePurchaseDate: {
    type: String,
  },
  careExpiryDate: {
    type: String,
  },
  invoice: String,
  pictures: [String],
  serialNo: String,
  referralCode: {
    type: String,
    min: 4,
    max: 10,
  },
},);

serviceSchema.pre("save", function (next) {
  const doc = this;
  const fieldsToRemove = [];

  // Iterate over the document's keys
  Object.keys(doc._doc).forEach((key) => {
    // Check if the value is null, undefined, or an empty array
    if (
      doc._doc[key] === null ||
      doc._doc[key] === undefined ||
      (Array.isArray(doc._doc[key]) && doc._doc[key].length === 0)
    ) {
      fieldsToRemove.push(key); // Add the key to the fieldsToRemove array
    }
  });

  // Remove fields with empty or null values
  fieldsToRemove.forEach((field) => {
    delete doc._doc[field];
  });

  next();
});


const service = mongoose.model('service detail', serviceSchema);

module.exports = service;