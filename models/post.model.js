'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Types = Schema.Types;

var commentSchema = new Schema({
    by: {
        id: Types.ObjectId,
        first_name: Types.String,
        last_name: Types.String
    },
    text: Types.String
});

commentSchema.set('toJSON', { virtuals: true });

commentSchema.virtual('created_at').get(function() {
    return this._id.getTimestamp();
});

var postSchema = new Schema({
    by: {
        _id: Types.ObjectId,
        first_name: Types.String,
        last_name: Types.String
    },
    herds: [
        {
            _id: Types.ObjectId,
            name: Types.String
        }
    ],
    type: {type: Types.String, enum: ['status', 'checkin', 'photo']},
    detail: Types.Mixed,// Mixed: Mongoose loses the ability to auto detect and save those changes, use markModified
    likes: [{
        _id: Types.ObjectId,
        first_name: Types.String,
        last_name: Types.String
    }],
    comments: [
        commentSchema
    ]
});

postSchema.set('collection', 'posts');

postSchema.set('toJSON', { virtuals: true });

postSchema.virtual('created_at').get(function() {
    return this._id.getTimestamp();
});

module.exports = mongoose.model('Post', postSchema);