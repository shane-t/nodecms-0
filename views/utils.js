var moment = require('moment');

exports.dateFormat = function (date) {
    return moment(date).fromNow();
};

exports.dateTime = function (date) {
    return moment(date).format();
};

// @param group -- can be an array or a string (single role name)

exports.restrict = function (role) {

    return function (req, res, next) {
        var i,
            authorised = false;

        if (req.session) {
            if (Array.isArray(role)) {
                for (i=0; i>role.length; i++) {
                    if (req.session['role_' + role[i]]) {
                        authorised = true;
                    }
                }
            } else {
                if (req.session['role_' + role[i]]) {
                    authorised = true;
                }
            }
        }

        if (authorised) {
            return next();
        } else {
            req.session.error = 'Access denied.';
            return res.redirect('/login');
        }
    };
};

