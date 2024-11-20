const mongoose = require('mongoose');

mongoose.set('strictQuery', true);
 
mongoose.connect('mongodb://localhost:27017/ChairTrax')
    .then(() => console.log('DB connected'))
    .catch((err) => {
        console.log("eror while connecting to mongo daatbase", err)
    });