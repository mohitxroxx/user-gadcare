const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  _id: false,
  customerId: {
    type: String,
    required: true
  },
  ServiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'All Users',
    required: true
  },
  carePurchaseDate: {
    type: String,
    required: true
  },
  careExpiryDate: {
    type: String,
    required: true
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  paymentIntent: {
    type: String,
  },
  paymentStatus: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  }
});

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
    enum: ["1-2 years old", "2-3 years old", "More than 3 years old", ""],
    default: ""
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
  referralCode: {
    type: String,
    min: 4,
    max: 10,
  },
  careFees: {
    type: Number,
    required: true,
  },
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
  payments: {
    type: [paymentSchema],
    default: []
  },
},);
const claimSchema = new mongoose.Schema({
  _id: false,
  claim_id: {
    type: mongoose.Schema.Types.ObjectId,
    alias: '_id',
    unique: true,
    index: true,
    required: true,
    auto: true,
  },
  claim_type: {
    type: String,
    required: true,
  },
  bankName: {
    type: String,
    required: true,
  },
  accName: {
    type: String,
    required: true,
  },
  accNum: {
    type: String,
    required: true,
  },
  swiftCode: {
    type: String,
    required: true,
  },
  IFSC: {
    type: String,
  },
  branchAdd: {
    type: String,
    required: true,
  },
  contactNum: {
    type: String,
    required: true,
  },
  images: {
    type: [String]
  },
  amount: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum:["Observing","Verified","Completed","Request Rejected"],
    default: "Observing"
  },
  admin_amount:{
    type:String,
    default:""
  },
  admin_message:{
    type:String,
    default:""
  },
  created_date: {
    type: Date,
    default: Date.now
  },
  updated_date: {
    type: Date,
    default: Date.now
  }
})
const earningSchema = new mongoose.Schema({ 
  amount: {
    type: Number,
    required: true
  },
  refid:{
    type:String,
    required:true
  },
  currency:{
    type:String,
    required:true
  },
  date: {
    type: Date,
    default: Date.now
  },
  link:{
    type:String,
    default:""
  }
})
const messageSchema=new mongoose.Schema({
  _id:false,
  message:{
    type:String,
    required:true
  },
  receivedAt:{
    type:Date,
    default:Date.now
  }
})
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  fName: {
    type: String,
    required: true,
  },
  mName: String,
  lName: {
    type: String,
    required: true,
  },
  services: {
    type: [serviceSchema],
    default: []
  },
  contact: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  city: String,
  state: String,
  zip: {
    type: String,
    min: 4,
    max: 10,
  },
  earning: {
    amount: {
      type: Number,
      default: 0,
    },
    records: [earningSchema],
  },
  claims: [claimSchema],
  messages:[messageSchema],
  refcode:{
    type:String,
    unique:true
  },
  icon:{
    type:String,
    default:""
  }
  // payments: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Payment Info'
  // }] 
  // payments: [paymentSchema]
});

userSchema.pre("save", function (next) {
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

module.exports = mongoose.model("All Users", userSchema);