module.exports = function (models, config, md) {
    //Homepage
    return {
        index : function(req, res){	
            models.post.find({}).sort('-_id').execFind(function(err, posts){
                res.render('home', { md: md, posts: (posts || null), session:req.session });
            });
        },
        home_post_handler : function(req, res){
            res.end();
        }
    }
};
