const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const server = require('http').createServer(app);
const bodyParser = require('body-parser');
// const publicPath = path.join(__dirname, 'Public', 'Profile');

global.basedir = __dirname;
global.APP_NAME = process.env.APP_NAME || 'ChairTrax'
global.APP_URL = process.env.APP_URL || 'http://localhost:3456'
const PORT = process.env.PORT || 3456

const corsOptions = {
    origin: global.APP_URL
}


app.use(cors(corsOptions));
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(`${__dirname}/public`))

require('./model/db');
require('./routes')(app)

app.get('/', (req, res) => {
    res.json({ message: "Welcome to the chairTrax page." })
});




app.listen(PORT, () => {
    console.log(`sever is running on port ${PORT}.`)
})

