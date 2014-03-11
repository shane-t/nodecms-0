module.exports = function (models, config, md) {
    return {
        page : function(req, res, next, page_id){
          var url = req.url.replace(/\//, "");
          console.log(url);

          if (typeof page_id !== "undefined") {
              console.log(page_id);
          }

          models.page.findOne({ 'url': url }, function(err, page){
              console.log(err);
              if (page) {
                res.render('page', { title:page.title, md: md, page: page, session : req.session })
              } else {
                next();
              }
          });
        },

        new : function(req, res){
            res.render('page_new', { title: "New Page", session : req.session });
        },

        new_handler : function(req, res){
            var title   = req.body.title || ""
            , url = title.split(' ').join('-').toLowerCase()

            , body  = req.body.body || ""
            , menu  = req.body.menu || ""
            , priority = req.body.priority || ""

            , newPage;

            //force
            if (!menu) {
                menu = false;
            }

            if (!title.length) {
                req.session.error = 'Enter a title';
            }

            if (!body.length) {
                req.session.error = 'Enter a page body';
            }

            if (!priority.length) {
                req.session.error = 'Enter a priority';
            }

            if (req.session.error) {
                req.session.body = body;
                return res.redirect('/page/new');
            }

            newPage = models.page({
                title: title,
                url: url,
                content: body,
                date: Date.now(),
                menu: menu,
                priority: priority
            });


            return newPage.save(function (err) {
                if (err) {
                    req.session.body = body;
                    req.session.error = err.message;
                    return res.redirect('/page/new');
                } else {
                    return res.redirect('/refresh/' + url);
                }
            });
        },

        delete : function(req, res){
            models.page.find({}).sort('-_id').execFind(function(err, pages){
                res.render('page_delete', { session:req.session, pages: (pages || null)});
            });
        },

        delete_handler : function(req, res, next) {
            var id = req.body.id;
            models.page.findOne({'_id': id}, function(err, match) {
                if (match) { 
                    match.remove();
                    console.log('removed page');
                    res.redirect('/page/delete');
                } else {
                    next();
                }
            });
        }
    }
}
