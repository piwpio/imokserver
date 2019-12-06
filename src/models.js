const userModel = {
    name: String,
    email: String,
    phone: String,
    password: String,
    token: String,
    isMaster: Boolean,
    slaves: Array, //slaves ids
    masterId: String
};

module.exports = {
    userModel: userModel
};
