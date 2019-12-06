const userModel = {
    name: String,
    email: String,
    phone: String,
    password: String,
    token: String,
    isMaster: Boolean,
    slaves: Array, //slaves ids
    //slave stuff
    masterId: String,
    isOk: Boolean,
    lastLocation: {lat: Number, long: Number},
    isActive: Boolean,
    interval: Number
};

module.exports = {
    userModel: userModel
};
