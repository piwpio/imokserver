function _isBody(reqBody) {
    return reqBody !== undefined;
}

function _returnError(code, message) {
    return {isError: true, code: code, message: message,}
}

function _returnSuccess() {
    return {isError: false, code: '', message: '',}
}

function validate(reqBody, validator) {
    if (!_isBody(reqBody)) {
        return _returnError(422, 'No body');
    }
    const customValidator = validator(reqBody);
    if (customValidator && customValidator.isError) {
        return customValidator;
    } else {
        return _returnSuccess();
    }
}

function createMaster(reqBody) {
    if (
        reqBody.name === undefined
        || reqBody.email === undefined
        || reqBody.phone === undefined
        || reqBody.password === undefined
        || reqBody.repassword === undefined
    ) {
        return _returnError(422, 'Not all parameters');
    } else if (!reqBody.name || !reqBody.email || !reqBody.phone || !reqBody.password || !reqBody.repassword) {
        return _returnError(422, 'Not all parameters filled');
    } else if (reqBody.password !== reqBody.repassword) {
        return _returnError(422, 'Passwords mismatch');
    }
}

function login(reqBody) {
    if (reqBody.password === undefined || reqBody.email === undefined) {
        return _returnError(422, 'Not all parameters');
    } else if (!reqBody.email || !reqBody.password) {
        return _returnError(422, 'Not all parameters filled');
    }
}

module.exports = {
    validate: validate,
    login: createMaster,
    createMaster: createMaster
};
