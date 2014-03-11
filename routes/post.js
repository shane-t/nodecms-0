module.exports = function (models, config, md) {
    return {

        //new post functions
        new : function(req, res){
            res.render('post_new', { title: "New Post", session:req.session});
        },

        new_handler : function(req, res){

            var title   = req.body.title || ""
            , subtitle = title.split(' ').join('-').toLowerCase() || ""

            , body = req.body.body || ""
            , newPost;

            if (!title.length) {
                req.session.error = 'Enter a title';
            }

            if (!body.length) {
                req.session.error = 'Enter a body';
            }
            

            if (req.session.error) {
                req.session.body = body;
                return res.redirect('/page/new');
            }

            //Submitting to database
            newPost = models.post({
                title: title,
                subtitle: subtitle,
                content: body,
                date: Date.now()
            });


            return newPost.save(function (err) {
                if (err) {
                    req.session.error = err.message;
                    req.session.body = body;
                    return res.redirect('/post/new');
                } else {
                    return res.redirect('/post/' + subtitle);
                }
            });
        },

        post : function(req, res, next){
            var subtitle = req.params.subtitle;
            models.post.findOne({'subtitle': subtitle}, function(err, post){
                if (post) {
                    models.comment.find({'postid': post._id}, function(err, comments){
                        res.render('post_view', {md: md, title: post.title, post:post, comments:(comments || null), session:req.session})
                    });
                } else {
                    next();
                }
            });
        },

        post_handler : function(req, res, next){
            var subtitle = req.params.subtitle;
            models.post.findOne({'subtitle': subtitle}, function(err, post){
                if (post) {
                    var id = req.body.id,
                        name = req.body.name || 'anonymous',
                        comment = req.body.comment || null,
                        url = req.body.url || null,
                        newComment;

                    if (comment) {

                        //Submitting to database
                        newComment = models.comment({
                            postid: id,
                            name: name,
                            comment: comment,
                            url: url,
                            date: Date.now()
                        });

                        console.log(newComment);
                        console.log(name + ' said ' + comment);
                        
                        return newComment.save(function (err) {
                            if (!err) {
                                return res.redirect('/post/' + post.subtitle);
                            } else {
                                req.session.error = err.message;
                            }
                        });
                    } else {
                        next();
                    }
                } else {
                    next();
                }
            });
        },

        delete : function(req, res){
            models.post.find({}).sort('-_id').execFind(function(err, posts){
                res.render('post_delete', { posts: (posts || null), session:req.session});
            });
        },

        delete_handler : function(req, res, next) {
            var id = req.body.id;

            models.post.findOne({'_id': id}, function(err, match){
                if (match) {
                    match.remove();
                    console.log('removed post');
                    res.redirect('/post/delete');
                } else {
                    res.redirect('/')
                }
            });
        }
    }
}
