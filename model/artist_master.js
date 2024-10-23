const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const artistMaster = Schema({
    playList_id:{type:mongoose.Schema.Types.ObjectId},
    artistName: { type: String },
    artistImg: { type: String },
    deleted_at: { type: Date, default: null }
}, {
    versionKey: false,
    timestamps: true
});

artistMaster.static = {
    /**
     * 
     * get data
     * @param {*} filter
     * @returns
     */
    async get(id) {
        return this.findOne(id)
    },
    /**
     * 
     * get list of data
     * @param {*} filter
     */
    async list(filter = {}) {
        return this.find(filter)
    }
}


let publicPath = APP_URL + '/public/'

artistMaster.methods.toJSON = function () {
    var obj = this.toObject();
    var objKeys = Object.keys(obj);
    objKeys.forEach(key => {
        if (obj[key] == null) {
            obj[key] = ''
        }
    });

    if(obj.artistImg && obj.artistImg!==''){
        obj.artistImg=publicPath+'profile/'+obj.artistImg
    }
    return obj
}


module.exports=mongoose.model('artist_master',artistMaster);