const mongoose=require('mongoose');
const Schema = mongoose.Schema

const userMaster = Schema({
    name:{type:String},
    email:{type:String},
    phone:{type:String},
    address:{type:String},
    password:{type:String},
    confirmPassword:{type:String},
    deleted_at:{type:Date,default:null}
},{
    versionKey:false,
    timestamps:true
})

userMaster.static={
    /**
     * get data
     * @param {*} filter
     * @returns
     */
    async get(id){
        return this.findOne(id)
    },
    /**
     * get list of data
     * @param {*} filter
     * @returns
     */
    async list(filter={}){
        return this.find(filter)
    }
}

let publicPath = APP_URL + '/public/';

userMaster.methods.toJSON=function(){
    var obj = this.toObject();
    var objKeys = Object.keys(obj);
    objKeys.forEach(key=>{
        if(obj[key]==null){
            obj[key]=''
        }
    })
    return obj
}

module.exports=mongoose.model('user_masters',userMaster);