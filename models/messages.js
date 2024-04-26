const mongoose=require('mongoose')
const messageSchema=new mongoose.Schema({
    message:{
        type:String,
        required:true
    },
    target:{
        type:String,
        required:true
    },
    sentAt:{
        type:Date,
        default:Date.now
    }
})

const msg=mongoose.model('Message',messageSchema)

module.exports=msg