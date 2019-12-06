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
    res.setHeader('Content-Type', 'application/json');

    const reqBody = req.body;
    const validator = Validator.validate(reqBody, Validator.login);
    if (validator.isError) {
        res.status(validator.code).send(validator.message);
        return;
    }

    MUserModel.findOne({email : reqBody.email}, function (err, user) {
        if (user) {
            const password = crypto.createHash('sha256', PASS_SALT).update(reqBody.password).digest('hex');
            if (password === user.password) {
                const a = Date.now() + '.' + new Date().getMilliseconds();
                const token = crypto.createHash('sha256', TOKEN_SALT).update(a).digest('hex');

                MUserModel.findByIdAndUpdate(user.id, {token: token}, (err, doc) => {
                    res.end(JSON.stringify({
                        ok: true,
                        data: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            phone: user.phone,
                            isMaster: user.isMaster,
                            token: token
                        }
                    }));
                });
            } else {
                res.end(JSON.stringify({
                    ok: false,
                    message: 'No user or wrong password'
                }));
            }
        } else {
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
    res.setHeader('Content-Type', 'application/json');

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
                token: password,
                isMaster: true,
                slaves: [],
                masterId: '0',
                isOk: true,
                lastLocation: {lat: 0, long: 0},
                isActive: false,
                interval: 0,
            });
            user.save().then(() => {
                res.end(JSON.stringify({
                    ok: true,
                }));
            });
        } else {
            res.end(JSON.stringify({
                ok: false,
                message: 'User already exists'
            }));
        }
    });
});

/**
 * Master get slaves
 */
app.post('/masterslaves', function(req, res) {
    res.setHeader('Content-Type', 'application/json');

    const reqBody = req.body;
    const validator = Validator.validate(reqBody, null, true);
    if (validator.isError) {
        res.status(validator.code).send(validator.message);
        return;
    }

    MUserModel.findOne({token : reqBody.token}, function (err, user) {
        if (user && user.isMaster) {
            if (user.slaves !== undefined && user.slaves.length > 0) {
                const idsArray = user.slaves.map(element => {
                    return mongoose.Types.ObjectId(element);
                });
                MUserModel.find({
                    '_id': { $in: idsArray}
                }, function(err, slaves) {
                    const slavesArr = slaves.map(slave => {
                        const slaveToFront = {
                            id: slave.id,
                            name: slave.name,
                            isOk: slave.isOk,
                            phone: slave.phone,
                            isActive: slave.isActive,
                            interval: slave.interval
                        };
                        if (
                            slave.lastLocation !== undefined
                            && slave.lastLocation.lat !== 0
                            && slave.lastLocation.long !== 0
                        ) {
                            slaveToFront.lastLocation = {
                                lat: slave.lastLocation.lat,
                                long: slave.lastLocation.long
                            }
                        }

                        return slaveToFront
                    });
                    res.end(JSON.stringify({
                        ok: true,
                        data: slavesArr
                    }));
                })
            } else {
                res.end(JSON.stringify({
                    ok: true,
                    data: []
                }));
            }

        } else {
            res.status(401).send('Unauthorized');
        }
    });
});

/**
 * Master create slave
 */
app.post('/createslave', function(req, res) {
    res.setHeader('Content-Type', 'application/json');

    const reqBody = req.body;
    const validator = Validator.validate(reqBody, Validator.createSlave, true);
    if (validator.isError) {
        res.status(validator.code).send(validator.message);
        return;
    }

    MUserModel.findOne({token : reqBody.token}, function (err, user) {
        if (user && user.isMaster) {
            if (user.slaves.length < 3) {
                MUserModel.findOne({name: reqBody.name, masterId: user._id}, (err, slaveExist) => {
                    if (!slaveExist) {
                        const password = crypto.createHash('sha256', PASS_SALT).update(reqBody.password+'').digest('hex');
                        const slave = new MUserModel({
                            name: reqBody.name,
                            email: '',
                            phone: reqBody.phone,
                            password: password,
                            token: password,
                            isMaster: false,
                            slaves: [],
                            masterId: user.id,
                            isOk: true,
                            lastLocation: {lat: 0, long: 0},
                            isActive: false,
                            interval: 60 * 60,
                        });
                        slave.save((err, slave) => {
                            user.slaves.push(slave.id);
                            user.save().then(() => {
                                res.end(JSON.stringify({
                                    ok: true,
                                }));
                            });
                        })
                    } else {
                        res.end(JSON.stringify({
                            ok: false,
                            message: 'Slave with name already exists'
                        }));
                    }
                });
            } else {
                res.end(JSON.stringify({
                    ok: false,
                    message: 'Too many slaves'
                }));
            }
        } else {
            res.status(401).send('Unauthorized');
        }
    });
});

/**
 * Master get slave
 */
app.post('/getslave', function(req, res) {
    res.setHeader('Content-Type', 'application/json');

    const reqBody = req.body;
    const validator = Validator.validate(reqBody, Validator.getSlave, true);
    if (validator.isError) {
        res.status(validator.code).send(validator.message);
        return;
    }

    MUserModel.findOne({token : reqBody.token}, function (err, user) {
        if (user && user.isMaster) {
            MUserModel.findOne({_id: reqBody.slave_id, masterId: user._id}, (err, slave) => {
                if (slave) {
                    const slaveRes = {
                        id: slave.id,
                        name: slave.name,
                        isOk: slave.isOk,
                        phone: slave.phone,
                        lastLocation: slave.lastLocation,
                        isActive: slave.isActive,
                        interval: slave.interval,
                    };
                    res.end(JSON.stringify({
                        ok: true,
                        data: slaveRes
                    }));
                } else {
                    res.end(JSON.stringify({
                        ok: false,
                        message: 'No slave in DB'
                    }));
                }
            });

        } else {
            res.status(401).send('Unauthorized');
        }
    });
});
