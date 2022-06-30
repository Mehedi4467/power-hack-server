const creatError = require('http-errors')

function notFoundHandeler(req, res, next) {
    next(creatError(404, "Your request content was not found!!"))
}

function errorHandeler(err, req, res, next) {
    res.locals.title = 'Error Page';
    res.json({ message: err.message })
}

module.exports = {
    notFoundHandeler,
    errorHandeler
}