module.exports = function (app, models, restrict, pages, config) {


    var  md          = require('node-markdown').Markdown

    // route definitions

    ,  admin       = require('./admin')(models, config, md)
    ,  user        = require('./user')(models, config, md)
    ,  post        = require('./post')(models, config, md)
    ,  page        = require('./page')(models, config, md)
    ,  home        = require('./home')(models, config, md);

    return {

        boot : function () {
            // apply routes

            app.get('/', home.index);

            app.get('/refresh/:subtitle', restrict('admin'), function (req, res) {
                pages.boot(app, page);
                res.redirect('/'+req.params.subtitle);
            });

            app.get('/post/delete', restrict('admin'), post.delete);
            app.get('/post/new', restrict('admin'), post.new);
            app.get('/post/:subtitle', post.post);

            app.get('/login' || '/login/', user.login);
            app.get('/signup' || '/signup/', user.signup);
            app.get('/profile' || '/profile/', user.profile);
  
            app.post('/login' || '/login/', user.login_handler);

            app.get('/user/delete', user.delete);

            app.get('/logout', function(req,res){
              req.session.destroy(function(){
                res.redirect('/');
              });
              console.log('logged out')
            });

            app.get('/page/new', restrict('admin'), page.new)
            app.get('/page/delete', restrict('admin'), page.delete)

            app.post('/', home.home_post_handler);

            app.post('/post/new', restrict('admin'), post.new_handler);
            app.delete('/post/:id', restrict('admin'), post.delete_handler);

            app.post('/page/new', restrict('admin'), page.new_handler);
            app.delete('/page/:id', restrict('admin'), page.delete_handler);
            
            app.post('/user/new', user.signup_handler);
            app.delete('/user/:username', user.delete_handler);

            app.post('/post/:subtitle', post.post_handler);

            //clever cache of pages
            app.get('/:pageurl' || '/:pageurl/', function (req, res, next) {
                if (app.pages.hasOwnProperty(req.params.pageurl)) {
                    page.page(req, res, next, app.pages[req.params.pageurl]);
                } else {
                    next();
                }
            });
        }
    }
}
