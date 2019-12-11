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
    isActive: Boolean,
    interval: Number,
    actions: Array,
    activateTime: Number,
    lastOkTime: Number
};

module.exports = {
    userModel: userModel
};
