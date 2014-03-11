module.exports = function (mongoose, validate, Schema, ObjectId) {
    var commentSchema = new Schema({
        id: ObjectId,
        postid: { type: ObjectId, ref : 'post', required: true },
        userid: { type: ObjectId, ref : 'user' },
        name: { type: String, required : true },
        url: String,
        comment: { type: String, required: true, validate: validate('max', 5000) },
        date: { type : Date, required : true }
    });

    commentSchema.pre('save', function (next) {
        var Post = mongoose.model('post');
            return Post.findOne({ '_id' : this.postid }, function (err, post) {
            if (!post) {
                return next(new Error('Invalid post'));
            } else {
                return next();
            }
        });
    });

    return  {
        schema : commentSchema
    };
};
