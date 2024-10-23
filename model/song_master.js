const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const songMaster=Schema({
    songName:{type:String},
    songFile:{type:String},
    category:{type:String},
    playList_id:[{type:mongoose.Schema.Types.ObjectId,
        ref:'playlist_masters'
    }],
    artist_id:{type:mongoose.Schema.Types.ObjectId,
        ref:'artist_masters'
    },
    type:{type:String},
    playCount: { type: Number, default: 0 },
    deleted_at:{type:Date,default:null}
},{
    versionKey:false,
    timestamps:true
});

songMaster.static={
    /**
     * 
     * get data 
     * @param {*} filter
     * @returns
     */
    async get(id){
        return this.findOne(id)
    },
    /**
     * 
     * get list of data
     * @param {*} filter
     * @returns
     */
    async list(filter={}){
        return this.find(filter);
    }
}

let publicPath=APP_URL+'/public/'

songMaster.methods.toJSON=function(){
    var obj = this.toObject();
    var objKeys=Object.keys(obj);
    objKeys.forEach(key=>{
        if(obj[key]==null){
            obj[key]=''
        }
    })

    if(obj.songImg && obj.songImg!==''){
        obj.songImg= publicPath+ 'profile/'+obj.songImg
    }
    return obj
}

module.exports=mongoose.model('song_master',songMaster);
