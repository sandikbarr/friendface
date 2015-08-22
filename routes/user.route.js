'use strict';

var createError = require('http-errors');
var User = require('../models/user.model.js');

module.exports = function(app) {
    app.get('/rest/users', getUsers, function(req, res, next) {
        return res.json(req.users);
    });

    app.get('/rest/users/:userId', getUser, function(req, res, next) {
        if (req.user) {
            return res.json(req.user);
        } else {
            return next(createError(404, 'userId ' + req.params.userId + ' not found'));
        }
    });

    app.post('/rest/users', createUser);

    app.delete('/rest/users/:userId', deleteUser);

    app.get('/rest/users/:userId/followers', getUser, function(req, res, next) {
        if (req.user && req.user.followers) {
            return res.json(req.user.followers);
        } else {
            return next(createError(404, 'userId ' + req.params.userId + ' not found'));
        }
    });

    app.get('/rest/users/:userId/herds', getUser, function(req, res, next) {
        if (req.user && req.user.herds) {
            return res.json(req.user.herds);
        } else {
            return next(createError(404, 'userId ' + req.params.userId + ' not found'));
        }
    });

    app.post('/rest/users/:id/herds', createHerd);

    app.get('/rest/users/:userId/herds/:herdId', getUser, function(req, res, next) {
        if (req.user && req.user.herds) {
            // TODO: $elemMatch query to return single element
            req.user.herds.forEach(function(herd) {
                if (herd._id.equals(req.params.herdId)) {
                    return res.json(herd);
                }
            });
        }
        return next(createError(404, 'userId/herdId ' + req.params.userId + '/' + req.params.herdId + ' not found'));
    });

    app.delete('/rest/users/:id/herds/:herdId', deleteHerd);

    app.put('/rest/users/:id/herds/:herdId', addToHerd);

    app.delete('/rest/users/:id/herds/:herdId/:userIdToBeRemoved', removeFromHerd);
};

function getUsers(req, res, next) {
    User.findByName(req.query.first_name, req.query.last_name, function(err, userResult) {
        if (err) {
            return next(createError(err));
        }
        req.users = userResult;
        next();
    });
}

function getUser(req, res, next) {
    User.findById(req.params.userId, function(err, userResult) {
        if (err) {
            return next(createError(err));
        }
        req.user = userResult;
        next();
    });
}

function createUser(req, res, next) {
    if (!req.body.first_name) {
        return next(createError(400, 'first_name required'));
    } else {
        var firstName = req.body.first_name;
        var lastName = req.body.last_name;
        var profile = req.body.profile;
    }
    var user = new User({
        first_name: firstName,
        last_name: lastName,
        profile: profile
    });
    user.save(function(err, user) {
        if (err) {
            return next(createError(err));
        }
        res.location('/rest/users/'+ user._id);
        return res.status(201).send();
    });
}

function deleteUser(req, res, next) {
    var userId = req.params.userId;

    User.remove(
        {_id: userId},
        function(err) {
            if (err) {
                return next(createError(err));
            }
            res.status(200).send();
        });
}

function createHerd(req, res, next) {
    if (!req.body.herd_name) {
        return next(createError(400,'herd_name required',{expose:false}));
    } else {
        var herdName = req.body.herd_name;
    }

    User.findOneAndUpdate(
        {_id: req.params.id},
        {$push: {herds: {name: herdName}}},
        function(err, user) {
            if (err) {
                return next(createError(err));
            }
            res.location('/rest/users/'+ user._id + '/herds');// TODO: This should be the location of the single herd resource, but we don't have the _id. Need to use save to get _id in result.
            req.user = user;
            return res.status(201).send();
        });
}

function deleteHerd(req, res, next) {
    var userId = req.params.id;
    var herdId = req.params.herdId;

    User.update(
        {_id: userId, 'herds._id': herdId},
        {$pull: {herds: {_id: herdId}}},
        function(err, result) {
            if (err) {
                return next(createError(err));
            }
            if (result.nModified === 1) {
                res.status(200).send();
            } else {
                next(createError(404, 'userId/herdId ' + userId + '/' + herdId + ' not found'));
            }
        });
}

function addToHerd(req, res, next) {
    if (!req.body.user_id) {
        return res.status(400).send('user_id required');
    } else {
        var userIdToBeFollowed = req.body.user_id;
        var userIdFollowing = req.params.id;
        var herdId = req.params.herdId;
        var herdName;
    }

    User.findById(userIdToBeFollowed, function(err, userToBeFollowed) {
        if (err) {
            return next(createError(err));
        }
        if (!userToBeFollowed) {
            return next(createError(404, 'userId ' + userIdToBeFollowed + ' not found'));
        } else {
            User.findOneAndUpdate(
                {_id: userIdFollowing, 'herds._id': herdId},
                {
                    $addToSet: {
                        'herds.$.members': {
                            _id: userToBeFollowed._id,
                            first_name: userToBeFollowed.first_name,
                            last_name: userToBeFollowed.last_name
                        }
                    }
                },
                function(err, userFollowing) {
                    if (err) {
                        return next(createError(err));
                    }
                    if (!userFollowing) {
                        return next(createError(404, 'userId/herdId ' + userIdFollowing + '/' + herdId + ' not found'));
                    } else {
                        userFollowing.herds.forEach(function(herd) {
                            if (herd._id.toString() === herdId) {
                                herdName = herd.name;
                            }
                        });
                        if (!herdName) {
                            return next(createError(404, 'herdId ' + herdId + ' not found'));
                        } else {
                            var alreadyFollowing = false;
                            userToBeFollowed.followers.forEach(function(follower) {
                                if (userFollowing._id.toString() === follower._id.toString()) {
                                    alreadyFollowing = true;
                                    var alreadyInThisHerd = false;
                                    follower.herds.forEach(function(herd) {
                                        if (herd._id.toString() === herdId) {
                                            alreadyInThisHerd = true;
                                        }
                                    });
                                    if (!alreadyInThisHerd) {
                                        follower.herds.push({
                                            _id: herdId,
                                            name: herdName
                                        });
                                    }
                                }
                            });
                            if (!alreadyFollowing) {
                                userToBeFollowed.followers.push({
                                    _id: userFollowing._id,
                                    first_name: userFollowing.first_name,
                                    last_name: userFollowing.last_name,
                                    herds: [{
                                        _id: herdId,
                                        name: herdName
                                    }]
                                });
                            }
                            userToBeFollowed.save(function(err, userFollowed) {
                                if (err) {
                                    return next(createError(err));
                                }
                                res.location('/rest/users/' + userFollowing._id + '/herds/' + herdId);
                                return res.status(200).send();
                            });
                        }
                    }
                }
            );
        }
    });
}

function removeFromHerd(req, res, next) {
    var userIdToBeRemoved = req.params.userIdToBeRemoved;
    var userIdFollowing = req.params.id;
    var herdId = req.params.herdId;

    User.update(
        {_id: userIdFollowing, 'herds._id': herdId},
        {$pull: {'herds.$.members': {_id: userIdToBeRemoved}}},
        function(err, result) {
            if (err) {
                return next(createError(err));
            }
            User.findOne(
                {_id: userIdToBeRemoved},
                function(err, userToBeRemoved) {
                    if (err) {
                        return next(createError(err));
                    }
                    if (!userToBeRemoved) {
                        return next(createError(404, 'userId ' + userIdToBeRemoved + ' not found'));
                    } else {
                        userToBeRemoved.followers.forEach(function(follower, followerIndex) {
                            if (follower._id.toString() === userIdFollowing) {
                                follower.herds.forEach(function(herd, herdIndex) {
                                    if (herd._id.toString() === herdId) {
                                        follower.herds.splice(herdIndex, 1);
                                    }
                                    if (follower.herds.length === 0) {
                                        userToBeRemoved.followers.splice(followerIndex, 1);
                                    }
                                });
                            }
                        });
                        userToBeRemoved.save(function(err, result) {
                            if (err) {
                                return next(createError(err));
                            }
                            return res.status(200).send();
                        });
                    }
                }
            );
        });
}