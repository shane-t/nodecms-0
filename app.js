var mongoose    = require('mongoose'),
    express     = require('express'),
    fs          = require('fs'),
    app         = express(),
    config      = require('./config').config,
    models      = require('./models')(app, mongoose, fs, config),

    db          = models.activateModels(),

    pages       = require('./pages')(app, db),

    utils       = require('./utils'),

    routes      = require('./routes')(app, db, utils.restrict, pages, config),

    http        = require('http'),
    path        = require('path'),

    store       = new express.session.MemoryStore();

//MIDDLEWARE
app.configure(function(){
    app.use(express.logger('dev'));

    app.set('port', process.env.PORT || 3001);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    app.use(express.favicon());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(function (req, res, next) {
        res.header('X-UA-Compatible', 'IE=edge,chrome=1');
        res.header('Content-Language', 'en');
        next();
    });

    app.use(express.session({ 
        secret: 'ar4452ihbb34y2b3hu4kvt2u34vu23y4yu324k',
        store: store
    }));

    app.use(function(req, res, next){
        var err = req.session.error,
            msg = req.session.flash;
        delete req.session.error;
        delete req.session.flash;
        res.locals.message = '';
        
        if (req.session.body) {
            res.locals.body = req.session.body;
            delete req.session.body;
        }

        if (msg) res.locals.message = '<p class="msg flash">' + msg + '</p>';
        if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
        next();
    });

    app.use(function (req, res, next) {
        res.locals.dateFormat = utils.dateFormat;
        res.locals.dateTime = utils.dateTime;
        next();
    });

    app.use(express.compress());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(app.router);

});

app.configure('development', function(){
    app.use(express.errorHandler());
    app.locals.pretty = true;
});

//default titles
app.locals.title = config.title;
app.locals.site_title = config.title;

//set up routes as defined in routes/*
routes.boot();

//set up all the redirects for the pages
pages.boot(routes.page);

//set up routes for the REST API
models.api(app, utils.restrict);

app.use(function(req,res){
    res.status(404);
    res.render('404', { session: req.session });
});

//GO
http.createServer(app).listen(app.get('port'), function(){
    console.log("Your app is running on port " + app.get('port'));
});
