module.exports = function (models, config, md) {
    var check = require('validator').check,
        sha1  = require('sha1');


    return {
        login_handler : function(req, res){

            var password = req.body.password || "",
                email    = req.body.email    || "",
                username = req.body.username || "";

    
            if (password === config.password) {

                console.log('passed');
                req.session.admin = true;
                res.redirect('/post/new')

            } else {

                req.session.error = 'Wrong Password';
                res.redirect('/login');

            }
        },

        login : function(req, res){
            if (req.xhr) {
                res.render( 'user_login', { session:req.session } );
            } else {
                res.render( 'user_login_page', { session: req.session });
            }
        },

        signup : function(req, res){
            if (req.xhr) {
              res.render( 'user_signup', { session:req.session } );
            } else {
              res.render( 'user_signup_page', { session : req.session });
            }
        },

        signup_handler : function (req, res) {

            var email = req.body.email || '',
                username = req.body.username || '',
                password = req.body.password || '',
                errors = [];

            if (  email.length && !check(email).isEmail()) {
                errors.push ({ message: 'Enter a valid email address', field: 'email' });
            }

            if ( !username.length ) {
                errors.push ({ message : 'Enter a username', field : 'username' });
            }

            if ( password.length < 5) {
                errors.push ({ message : 'Enter a password longer than 5 characters', field : 'password' });
            }

            if (!errors.length) {
                return models.user.find({ $or : [ { username : username }, { email : email } ] }, function (err, records) {
                    var user;

                    if (err) {
                        console.log(err);
                        return res.send(500, { status: 'error', errors : [ { message : err.message } ] });
                    }

                    if (records.length) {
                        return res.send(400, { status : 'error', errors : [ { message : 'user exists', field : 'username' } ] });
                    } else {
                        user = new models.user({
                            email   : email,
                            username: username,
                            password: sha1(password)
                        });

                        user.save(function (err, record) {
                            if (err) {
                                console.log(err);
                                return res.send(500, { status : 'error', message : err.message });
                            } 
                            req.session.email = record.email;
                            req.session.username = record.username;
                            req.session.logon = true;
                            if (req.xhr) {
                                return res.send(200, { status: 'ok', message : 'created' });
                            } else {
                                res.redirect('/home');
                            }
                        });
                    }


                });
            } else {
                req.session.error = errors;
                return res.send(400, { status: 'error', errors : errors });
            }

        },

        user           : function (req, res) {
            models.user.findOne({username: req.params.username}, function (err, user) {
                if (err) {
                    return res.send(500, err.message);
                }

                if (user) {
                    return res.render('user', { user : user, session: req.session });
                } else {
                    return res.render('404', { message: 'user not found' });
                }
            }); 
        },

        delete     : function (req, res) {
            models.user.find({}).sort('-_id').execFind(function(err, users){
                res.render('user_delete', { users: (users || null), session:req.session });
            });
        },

        delete_handler : function (req, res) {
            models.user.findOne({username: req.params.username}, function (err, user) {
                if (err) {
                    return res.send(500, err.message);
                }

                if (user) {
                    user.remove();
                    res.redirect('/user/delete');
                } else {
                    return res.render('404', { message: 'user not found' });
                }
            });
        }
    }
};
