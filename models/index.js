module.exports = function (app, mongoose, fs, config) {

    var db_url      = 'mongodb://localhost:27017/shanet_ie',
        validate    = require('mongoose-validator').validate,
        db          = mongoose.connect(db_url),
        models      = {},
        Schema      = mongoose.Schema,
        ObjectId    = Schema.ObjectId;

    /* include all files in the models directory & create a db schema for each */

    return {
        activateModels : function () {
            fs.readdirSync('./models/').forEach(function(file) {
                var bareName = file.split('.')[0],
                    model;

                if (bareName == 'index') return; //don't include self

                model  = require('./' + bareName)(mongoose, validate, Schema, ObjectId, config);

                db.model(bareName, model.schema);
                models[bareName] = mongoose.model(bareName);
            });
            return models;
        },

        api : function () {
            for (var bareName in models) {
                (function (bareName) {

                    app.get('/api/'+bareName, function (req, res) {
                        return models[bareName].find(function (err, matches) {
                            if (!err) {
                                if (matches) {
                                    return res.send(matches);
                                } else {
                                    return res.send({});
                                }
                            } else {
                                console.log(err);
                                return res.send(500, err.message);
                            }
                        });
                    });

                    app.get('/api/'+bareName+'/:id', function (req, res) {
                        return models[bareName].findById(req.params.id, function (err, match) {
                            if (!err) {
                                if (match) {
                                    return res.send(match);
                                } else {
                                    return res.send(404, {});
                                }
                            } else {
                                console.log(err);
                                return res.send(500, err.message);
                            }
                        });
                    });

                    app.post('/api/'+bareName, function (req, res) {
                        var record = new models[bareName](req.body);
                        //should send record before saving or after??
                        return record.save(function (err) {
                            if (!err) {
                                console.log('created');
                                return res.send(record);
                            } else {
                                return res.send(400, err.message);
                            }
                        });
                    });

                    app.put('/api/'+bareName+'/:id', function (req, res) {
                        return models[bareName].findById(req.params.id, function (err, match) {
                            if (!err) {
                                if (match) {
                                    console.log(req.body);
                                    console.log(match.schema.tree);
                                    for (var i in match.schema.tree) {
                                        if (i != '_id' && i in req.body) {
                                            match[i] = req.body[i];
                                        }
                                    }
                                    return match.save(function(err, record) {
                                        if (!err) {
                                            console.log('saved');
                                            return res.send(record);
                                        } else {
                                            console.log(err);
                                            return res.send(400, err.message);
                                        }
                                    });
                                } else {
                                    return res.send(404, {});
                                }
                            } else {
                                console.log(err);
                                return res.send({});
                            }
                        });
                    });

                    app.delete('/api/'+bareName+'/:id', function (req, res) {
                        return models[bareName].findById(req.params.id, function (err, match) {
                            if (match) {
                                return match.remove(function (err) {
                                    if (!err) {
                                        return res.send('');
                                    } else  {
                                        return res.send(500);
                                    }
                                });
                            } else {
                                return res.send(404);
                            }
                        });
                    });

                })(bareName);
            }
        }
    };
};
