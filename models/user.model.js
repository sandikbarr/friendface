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
    ],
    updated_at: Types.Date
});

userSchema.set('collection', 'users');

userSchema.set('toJSON', { virtuals: true });

userSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

userSchema.virtual('created_at').get(function() {
    return this._id.getTimestamp();
});

userSchema.virtual('full_name').get(function () {
    var full_name = this.first_name;
    if (this.last_name) {
        full_name += ' ' + this.last_name;
    }
    return full_name;
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