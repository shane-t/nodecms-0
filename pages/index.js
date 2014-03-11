module.exports = function (app, models) {
    var Page = models.page;
    
    return {
        boot : function (page_route) {
            console.log("booting pages");
            app.locals.menu = [];
            app.pages = {};

            Page.find({}).sort('priority').execFind(function(err, pages){
                for (var i = 0; i<pages.length; i++ ) {

                    app.pages[pages[i].url] = pages[i]._id ; //this cache is used in the page route

                    if (pages[i].menu) {
                        app.locals.menu.push(pages[i]);
                    }
                }
            });
        }
    }
}
