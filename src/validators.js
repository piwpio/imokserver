function _isBody(reqBody) {
    return reqBody !== undefined;
}

function _isToken(reqBody) {
    return reqBody.token !== undefined && reqBody.token;
}

function _returnError(code, message) {
    return {isError: true, code: code, message: message,}
}

function _returnSuccess() {
    return {isError: false, code: '', message: '',}
}

function validate(reqBody, validator, isToken) {
    validator = validator === undefined || validator === null ? function(){} : validator;
    isToken = isToken === undefined ? false : isToken;

    if (!_isBody(reqBody)) {
        return _returnError(422, 'No body');
    }
    if (isToken && !_isToken(reqBody)) {
        return _returnError(401, 'Unauthorized');
    }
    const customValidator = validator(reqBody);
    if (customValidator && customValidator.isError) {
        return customValidator;
    } else {
        return _returnSuccess();
    }
}

function login(reqBody) {
    if (reqBody.password === undefined || reqBody.email === undefined || reqBody.master_login === undefined) {
        return _returnError(422, 'Not all parameters');
    } else if (!reqBody.email || !reqBody.password || typeof reqBody.master_login !== 'boolean') {
        return _returnError(422, 'Not all parameters filled');
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

function createSlave(reqBody) {
    if (
        reqBody.name === undefined
        || reqBody.phone === undefined
        || reqBody.password === undefined
        || reqBody.repassword === undefined
    ) {
        return _returnError(422, 'Not all parameters');
    } else if (!reqBody.name || !reqBody.phone || !reqBody.password || !reqBody.repassword) {
        return _returnError(422, 'Not all parameters filled');
    } else if (reqBody.password !== reqBody.repassword) {
        return _returnError(422, 'PIN mismatch');
    }
}

function getSlave(reqBody) {
    if (reqBody.slave_id === undefined) {
        return _returnError(422, 'Not all parameters');
    } else if (!reqBody.slave_id) {
        return _returnError(422, 'Not all parameters filled');
    }
}

function manageSlave(reqBody) {
    if (
        reqBody.slave_id === undefined
        || reqBody.is_active === undefined
        || reqBody.interval === undefined
    ) {
        return _returnError(422, 'Not all parameters');
    } else if (!reqBody.slave_id || typeof reqBody.is_active !== 'boolean' || !reqBody.interval) {
        return _returnError(422, 'Not all parameters filled');
    }
}

function updateSlave(reqBody) {
    if (
        reqBody.slave_id === undefined
        || reqBody.name === undefined
        || reqBody.phone === undefined
        || reqBody.password === undefined
        || reqBody.repassword === undefined
    ) {
        return _returnError(422, 'Not all parameters');
    } else if (!reqBody.slave_id || !reqBody.name || !reqBody.phone) {
        return _returnError(422, 'Not all parameters filled');
    } else if (reqBody.password !== reqBody.repassword) {
        return _returnError(422, 'PIN mismatch');
    }
}

function deleteSlave(reqBody) {
    if (reqBody.slave_id === undefined) {
        return _returnError(422, 'Not all parameters');
    } else if (!reqBody.slave_id) {
        return _returnError(422, 'Not all parameters filled');
    }
}

function isOk(reqBody) {
    if (reqBody.is_ok === undefined) {
        return _returnError(422, 'Not all parameters');
    } else if (typeof reqBody.is_ok !== 'boolean') {
        return _returnError(422, 'Not all parameters filled');
    }
}

module.exports = {
    validate: validate,
    login: login,
    createMaster: createMaster,
    createSlave: createSlave,
    getSlave: getSlave,
    manageSlave: manageSlave,
    updateSlave: updateSlave,
    deleteSlave: deleteSlave,
    isOk: isOk
};
