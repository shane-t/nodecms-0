module.exports = function (mongoose, validate, Schema, ObjectId) {
    var pageSchema = new Schema({
        id: ObjectId,
        author: { type: ObjectId, ref : 'user' },
        title: { type: String, required : true },
        url: { type: String, required : true },
        tags: Array,
        content: { type : String, required : true},
        date: { type: Date, required : true },
        menu: { type: Boolean, required : true },
        priority : Number
    });

    //check for duplicate page
    pageSchema.pre('save', function (next) {
        var Page = mongoose.model('page'), //<--- do something about this !!
            that = this;

        return Page.find({'url' :  this.url }, function (err, page) {

            //if there's a page in with the same subtitle but a different page, it's a duplicate

            if (page.length && page._id !== that.id) {
                return next(new Error('A page with this subtitle already exists'));
            } else {
                next();
            }
        });
    });

    return {
        schema : pageSchema
    };
};
