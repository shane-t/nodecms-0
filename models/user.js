module.exports = function (mongoose, validate, Schema, ObjectId, config) {
    var schema = {
        id          : ObjectId,
        email       : { type: String},
        username    : { type: String, required : true, default : "" },
        url         : String,
        image       : String,
        password    : String,
        joined      : { type: Date, default : Date.now, required : true }
    }, i,
    userSchema;

    for ( i=0;i<config.siteroles.length; i++ ) {
        schema['role_' + config.siteroles[i]] = { type : Boolean, default : false, required: false };
    }

    userSchema = new Schema(schema);

    userSchema.methods.getRoles = function () {
 
        var roles = {},
            prop,
            attributes = this.toJSON();

        for (prop in attributes) {
            if (attributes.hasOwnProperty(prop) && prop.match(/^role_/)) {
                roles[prop] = attributes[prop];
            }
        }

        return roles;
    };

    userSchema.methods.getRoleArray = function () {
        var list = [],
            roles = this.getRoles(),
            role;

        for (role in roles) {
            list.push(roles[roles]);
        }
        return list;
    };


    return {
        schema : userSchema
    };
};
