const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const crypto = require('crypto');
const PASS_SALT = 'mlecznakrowalaciatka';
const TOKEN_SALT = 'starebabyjebacpradem';
const PASS_SLAVE_SALT = 'korwinkroool';

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
        const a = Date.now() + '.' + new Date().getMilliseconds();
        if (user) {
            if (reqBody.master_login) {
                // master login
                const password = crypto.createHash('sha256', PASS_SALT).update(reqBody.password).digest('hex');
                if (password === user.password) {
                    const token = crypto.createHash('sha256', TOKEN_SALT + user.name).update(a).digest('hex');
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
                //salve login
                const slavePassword = crypto.createHash('sha256', PASS_SLAVE_SALT).update(reqBody.password).digest('hex');
                MUserModel.findOne({masterId: user.id, password : slavePassword}, function (err, slave) {
                    if (slave) {
                        const slaveToken = crypto.createHash('sha256', TOKEN_SALT + slave.name).update(a).digest('hex');
                        MUserModel.findByIdAndUpdate(slave.id, {token: slaveToken}, (err, doc) => {
                            res.end(JSON.stringify({
                                ok: true,
                                data: {
                                    id: slave.id,
                                    name: slave.name,
                                    email: slave.email,
                                    phone: slave.phone,
                                    isMaster: slave.isMaster,
                                    token: slaveToken
                                }
                            }));
                        });
                    } else {
                        res.end(JSON.stringify({
                            ok: false,
                            message: 'No user or wrong password'
                        }));
                    }
                });
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
 * Check if still logged and return user
 */
app.post('/checkstilllogged', function(req, res) {
    res.setHeader('Content-Type', 'application/json');

    const reqBody = req.body;
    const validator = Validator.validate(reqBody, null, true);
    if (validator.isError) {
        res.status(validator.code).send(validator.message);
        return;
    }

    MUserModel.findOne({token : reqBody.token}, function (err, user) {
        if (user) {
            res.end(JSON.stringify({
                ok: true,
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    isMaster: user.isMaster,
                    token: user.token
                }
            }));
        } else {
            res.status(401).send('Unauthorized');
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
                token: '',
                isMaster: true,
                slaves: [],
                masterId: '0',
                isOk: true,
                actions: [],
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
                        return {
                            id: slave.id,
                            name: slave.name,
                            phone: slave.phone,
                            isOk: slave.isOk,
                            isActive: slave.isActive,
                            interval: slave.interval,
                            actions: slave.actions,
                            isLogged: slave.token !== ''
                        }
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
                        const password = crypto.createHash('sha256', PASS_SLAVE_SALT).update(reqBody.password+'').digest('hex');
                        const slave = new MUserModel({
                            name: reqBody.name,
                            email: '',
                            phone: reqBody.phone,
                            password: password,
                            token: '',
                            isMaster: false,
                            slaves: [],
                            masterId: user.id,
                            isOk: true,
                            isActive: false,
                            interval: 60 * 60,
                            actions: []
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
                        phone: slave.phone,
                        isOk: slave.isOk,
                        isActive: slave.isActive,
                        interval: slave.interval,
                        actions: slave.actions,
                        isLogged: slave.token !== ''
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

/**
 * Master update slave activity
 */
app.post('/manageslave', function(req, res) {
    res.setHeader('Content-Type', 'application/json');

    const reqBody = req.body;
    const validator = Validator.validate(reqBody, Validator.manageSlave, true);
    if (validator.isError) {
        res.status(validator.code).send(validator.message);
        return;
    }

    MUserModel.findOne({token : reqBody.token}, function (err, user) {
        if (user && user.isMaster) {
            MUserModel.findOne({_id: reqBody.slave_id, masterId: user._id}, (err, slave) => {
                if (slave) {
                    MUserModel.findByIdAndUpdate(reqBody.slave_id, {isActive: reqBody.is_active, interval: reqBody.interval}, (err, doc) => {
                        res.end(JSON.stringify({
                            ok: true
                        }));
                    });
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

/**
 * Master edit slave
 */
app.post('/editslave', function(req, res) {
    res.setHeader('Content-Type', 'application/json');

    const reqBody = req.body;
    const validator = Validator.validate(reqBody, Validator.updateSlave, true);
    if (validator.isError) {
        res.status(validator.code).send(validator.message);
        return;
    }

    MUserModel.findOne({token : reqBody.token}, function (err, user) {
        if (user && user.isMaster) {
            MUserModel.findById(reqBody.slave_id, (err, slaveExist) => {
                if (slaveExist) {
                    MUserModel.findOne({name: reqBody.name, masterId: user._id}, (err, slaveExist) => {
                        if (!slaveExist || (slaveExist && slaveExist.id === reqBody.slave_id)) {
                            let updateObject = {
                                name: reqBody.name,
                                phone: reqBody.phone,
                            };
                            if (reqBody.password !== '' && reqBody.repassword !== '') {
                                updateObject.password = crypto.createHash('sha256', PASS_SLAVE_SALT).update(reqBody.password+'').digest('hex');
                            }

                            MUserModel.findByIdAndUpdate(reqBody.slave_id, updateObject, (err, doc) => {
                                res.end(JSON.stringify({
                                    ok: true,
                                }));
                            });
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
                        message: 'Slave not exists'
                    }));
                }
            });
        } else {
            res.status(401).send('Unauthorized');
        }
    });
});

/**
 * Master logout slave
 */
app.post('/logoutslave', function(req, res) {
    res.setHeader('Content-Type', 'application/json');

    const reqBody = req.body;
    const validator = Validator.validate(reqBody, null, true);
    if (validator.isError) {
        res.status(validator.code).send(validator.message);
        return;
    }

    MUserModel.findOne({token : reqBody.token}, function (err, user) {
        if (user && user.isMaster) {
            MUserModel.findById(reqBody.slave_id, (err, slaveExist) => {
                if (slaveExist) {
                    MUserModel.findByIdAndUpdate(reqBody.slave_id, {token: ''}, (err, doc) => {
                        res.end(JSON.stringify({
                            ok: true
                        }));
                    });
                } else {
                    res.end(JSON.stringify({
                        ok: false,
                        message: 'Slave not exists'
                    }));
                }
            });
        } else {
            res.status(401).send('Unauthorized');
        }
    });
});

/**
 * Master delete slave
 */
app.post('/deleteslave', function(req, res) {
    res.setHeader('Content-Type', 'application/json');

    const reqBody = req.body;
    const validator = Validator.validate(reqBody, Validator.deleteSlave, true);
    if (validator.isError) {
        res.status(validator.code).send(validator.message);
        return;
    }

    MUserModel.findOne({token : reqBody.token}, function (err, user) {
        if (user && user.isMaster) {
            const slaveIndex = user.slaves.indexOf(reqBody.slave_id);
            if (slaveIndex !== -1) {
                const newSlaves = user.slaves.filter(function( slaveId ) {
                    return slaveId !== reqBody.slave_id;
                });
                MUserModel.findByIdAndUpdate(user.id, {slaves: newSlaves}, (err, doc) => {
                    MUserModel.findByIdAndUpdate(reqBody.slave_id, {masterId: ''}, (err, doc) => {
                        res.end(JSON.stringify({
                            ok: true
                        }));
                    });
                });
            } else {
                res.end(JSON.stringify({
                    ok: false,
                    message: 'Slave not exists'
                }));
            }
        } else {
            res.status(401).send('Unauthorized');
        }
    });
});

/**
 * Slave isok isok
 */
app.post('/isok', function(req, res) {
    res.setHeader('Content-Type', 'application/json');

    const reqBody = req.body;
    const validator = Validator.validate(reqBody, Validator.isOk, true);
    if (validator.isError) {
        res.status(validator.code).send(validator.message);
        return;
    }

    MUserModel.findOne({token : reqBody.token}, function (err, user) {
        if (user && !user.isMaster) {
            user.actions.unshift({
                lat: 50.0729063,
                long: 19.9079619,
                time: Date.now(),
                isOk: reqBody.is_ok
            });
            MUserModel.findByIdAndUpdate(user.id, {isOk: reqBody.is_ok, actions: user.actions}, (err, doc) => {
                res.end(JSON.stringify({
                    ok: true
                }));
            });
        } else {
            res.status(401).send('Unauthorized');
        }
    });
});
