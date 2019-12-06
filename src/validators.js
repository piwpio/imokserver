function createMaster(reqBody) {
    let isError = false;
    let code;
    let message;

    if (reqBody === undefined) {
        isError = true;
        code = 422;
        message = 'No body';
    } else if (
        reqBody.name === undefined
        || reqBody.email === undefined
        || reqBody.phone === undefined
        || reqBody.password === undefined
        || reqBody.repassword === undefined
    ) {
        isError = true;
        code = 422;
        message = 'Not all parameters';
    } else if (!reqBody.name || !reqBody.email || !reqBody.phone || !reqBody.password || !reqBody.repassword) {
        isError = true;
        code = 422;
        message = 'Not all parameters filled';
    } else if (reqBody.password !== reqBody.repassword) {
        isError = true;
        code = 422;
        message = 'Passwords mismatch';
    }

    return {
        isError: isError,
        code: code,
        message: message,
    }
}

module.exports = {
    createMaster: createMaster
};
