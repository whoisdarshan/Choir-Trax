const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartMaster = Schema({
    user_id:{type:mongoose.Schema.Types.ObjectId},
    song_id:{type:mongoose.Schema.Types.ObjectId},
    deleted_at:{type:Date,default:null}
},{
    versionKey:false,
    timestamps:true
});

module.exports= mongoose.model('cart_masters',cartMaster);

