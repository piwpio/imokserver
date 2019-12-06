const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const crypto = require('crypto');
const PASS_SALT = 'mlecznakrowalaciatka';
const TOKEN_SALT = 'najlepszememe';

const model = require('./src/models');
const MUserSchema = new mongoose.Schema(model.userModel);
const MUserModel = mongoose.model('imok_users', MUserSchema);

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
 * login
 */
app.post('/login', function(req, res) {
    const reqBody = req.body;
    const validator = Validator.validate(reqBody, Validator.login);
    if (validator.isError) {
        res.status(validator.code).send(validator.message);
        return;
    }

    MUserModel.findOne({email : reqBody.email}, function (err, document) {
        if (document) {
            const password = crypto.createHash('sha256', PASS_SALT).update(reqBody.password).digest('hex');
            if (password === document.password) {
                const a = Date.now() + '.' + new Date().getMilliseconds();
                const token = crypto.createHash('sha256', TOKEN_SALT).update(a).digest('hex');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    ok: true,
                    data: {
                        id: document.id,
                        name: document.name,
                        email: document.email,
                        phone: document.phone,
                        isMaster: document.isMaster,
                        token: token
                    }
                }));
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    ok: false,
                    message: 'No user or wrong password'
                }));
            }
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                ok: false,
                message: 'No user or wrong password'
            }));
        }
    });
});
/**
 * New master registration
 */
app.post('/createmaster', function(req, res) {
    const reqBody = req.body;
    const validator = Validator.validate(reqBody, Validator.createMaster);
    if (validator.isError) {
        res.status(validator.code).send(validator.message);
        return;
    }


    MUserModel.findOne({email : reqBody.email}, function (err, document) {
        if (!document) {
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
