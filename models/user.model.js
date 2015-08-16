'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Types = Schema.Types;

var herdSchema = new Schema({
    name: Types.String,
    members: [
        {
            _id: Types.ObjectId,
            first_name: Types.String,
            last_name: Types.String
        }
    ]
});

var userSchema = new Schema({
    first_name: Types.String,
    last_name: Types.String,
    profile: {
        age: Types.Number,
        location: Types.String,
        occupation: Types.String
    },
    followers: [
        {
            _id: Types.ObjectId,
            first_name: Types.String,
            last_name: Types.String,
            herds: [
                {
                    _id: Types.ObjectId,
                    name: Types.String
                }
            ]
        }
    ],
    herds: [
        herdSchema
    ]
});

userSchema.set('collection', 'users');

userSchema.set('toJSON', { virtuals: true });

userSchema.virtual('full_name').get(function () {
    return this.first_name + ' ' + this.last_name;
});

userSchema.virtual('full_name').set(function (name) {
    if (name.indexOf(' ') >= 0) {
        var split = name.split(' ');
        this.first_name = split[0];
        this.last_name = split[1];
    } else {
        this.first_name = name;
    }
});

userSchema.statics.findByName = function(firstName, lastName, cb) {
    var query = {};
    if (firstName) {
        query.first_name = firstName;
    }
    if (lastName) {
        query.last_name = lastName;
    }
    return this.find(query, cb);
};

module.exports = mongoose.model('User', userSchema);