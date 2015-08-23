'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Types = Schema.Types;

var feedSchema = new Schema({
    user_id: Types.ObjectId,
    month: Types.String,// one feed document per month to keep a “page” of recent posts in the initial page view
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

feedSchema.set('collection', 'posts');

feedSchema.set('toJSON', { virtuals: true });

feedSchema.virtual('created_at').get(function() {
    return this._id.getTimestamp();
});

feedSchema.methods.getPriorMonthFeed = function(cb) {
    var priorMonth = new Date(parseInt(this.month.substr(0,4)), parseInt(this.month.substr(4,2)) - 2, 1);
    var month = '' + priorMonth.getFullYear();
    if (priorMonth.getMonth() < 9) {
        month += '0' + (priorMonth.getMonth() + 1);
    } else {
        month += '' + (priorMonth.getMonth() + 1);
    }
    var query = this.model('Feed').find({user_id: this.user_id});
    query.where({month: month});
    return query.exec(cb);
};

module.exports = mongoose.model('Feed', feedSchema);