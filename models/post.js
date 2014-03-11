module.exports = function (mongoose, validate, Schema, ObjectId) {
    var postSchema = new Schema({
            id: ObjectId,
            author : { type : ObjectId, ref : 'user' },
            title: { type : String, required : true },
            subtitle: { type : String, required : true },
            tags: Array,
            content: { type : String, required : true },
            date: { type : Date, required : true }
        });

    postSchema.pre('save', function (next) {
        console.log("validating content");
        if (!this.content || !this.content.length) {
            return next(new Error('No content for post'));
        }
        return next();
    });

    postSchema.pre('save', function (next) {
        var User = mongoose.model('user');
        return User.find({'_id' :  this.author }, function (err, user) {
            if (!user) {
                return next(new Error('Author is a non existent user.'));
            } else {
                next();
            }
        });
    });

    postSchema.pre('remove', function (next) {
        var Comment = mongoose.model('comment'), /// <--- todo pass this in 
            that = this;

        models.comment.find({'postid': that.id}, function(err, comments){
            if (comments.length) {
                for ( i=0; i<comments.length; i++ ) {
                    comments[i].remove();
                    console.log('removed comment');
                }
            }
        });
        next();
    });

    return {
        schema : postSchema
    };
};
