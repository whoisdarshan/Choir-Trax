const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const OTPMaster= Schema({
    otp_code:{type:Number},
    email:{type:String
    },
    ccode:{type:String},
    deleted_at:{type:Date,defaut:null}
},{
    versionKey : false,
    timestamps:true
});

module.exports=mongoose.model('otp_masters',OTPMaster)