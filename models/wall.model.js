'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Types = Schema.Types;
var Post = require('../models/post.model.js');

var wallSchema = new Schema({
    user_id: Types.ObjectId,
    month: Types.String,// one wall document per month to keep a “page” of recent posts in the initial page view
    posts: [
        {
            _id: Types.ObjectId,
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
            comments_shown: Types.Number,// because $size query operator does not allow inequality comparisons
            comments: [
                {
                    _id: Types.ObjectId,
                    by: {
                        _id: Types.ObjectId,
                        first_name: Types.String,
                        last_name: Types.String
                    },
                    text: Types.String
                }
            ]
        }
    ]
});

wallSchema.set('collection', 'posts');

wallSchema.set('toJSON', { virtuals: true });

wallSchema.virtual('created_at').get(function() {
    return this._id.getTimestamp();
});

module.exports = mongoose.model('Wall', wallSchema);