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

module.exports = mongoose.model('User', userSchema);