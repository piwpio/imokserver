const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const crypto = require('crypto');
const PASS_SALT = 'mlecznakrowalaciatka';

const model = require('./src/models');
const MUserSchema = new mongoose.Schema(model.userModel);

const Validator = require('./src/validators');


const app = express();
const server = require("http").Server(app);

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    bodyParser.urlencoded({ extended: false });
    next();
});
app.use(bodyParser.json());

server.listen(8080);
console.log("SERVER LISTENING");

mongoose.connect(
    'mongodb://localhost:27017/imok',
    {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: true
    }
);

console.log("SERVER STARTED");

/**
 * New master registration
 */
app.post('/createmaster', function(req, res) {
    const reqBody = req.body;

    const validator = Validator.createMaster(reqBody);
    if (validator.isError) {
        res.status(validator.message).send(validator.message);
        return;
    }

    let MUserModel = mongoose.model('imok_users', MUserSchema);
    MUserModel.findOne({email : reqBody.email}, function (err, document) {
        if (!document){
            const password = crypto.createHash('sha256', PASS_SALT).update(reqBody.password).digest('hex');
            const user = new MUserModel({
                name: reqBody.name,
                email: reqBody.email,
                phone: reqBody.phone,
                password: password,
                isMaster: true
            });
            user.save().then(() => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    ok: true,
                }));
            });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                ok: false,
                message: 'User already exists'
            }));
        }
    });
});






// const User = mongoose.model('imok_users', { name: String });
//
// const user = new User({ name: 'Zildjian' });
// user.save().then(() => console.log('jebać'));
