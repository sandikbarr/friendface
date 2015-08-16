'use strict';

var User = require('../models/user.model.js');

module.exports = function(app) {
    app.get('/rest/users/:id', getUser, function(req, res, next) {
        if (req.user) {
            return res.json(req.user);
        } else {
            return res.status(404).json(generateNotFoundResponse('user', 'id', req.params.id));
        }
    });

    app.post('/rest/users', createUser, function(req, res, next) {
        if (req.user) {
            return res.status(201).send();
        } else {
            res.status(500).send('an error occurred');
        }
    });

    app.get('/rest/users/:id/followers', getUser, function(req, res, next) {
        if (req.user && req.user.followers) {
            return res.json(req.user.followers);
        } else {
            return res.status(404).json(generateNotFoundResponse('user', 'id', req.params.id));
        }
    });

    app.get('/rest/users/:id/herds', getUser, function(req, res, next) {
        if (req.user && req.user.herds) {
            return res.json(req.user.herds);
        } else {
            return res.status(404).json(generateNotFoundResponse('user', 'id', req.params.id));
        }
    });

    app.post('/rest/users/:id/herds', createHerd, function(req, res, next) {
        if (req.user && req.user.herds) {
            return res.status(201).send();
        } else {
            return res.status(404).json(generateNotFoundResponse('user', 'id', req.params.id));
        }
    });

    app.get('/rest/users/:id/herds/:herdId', getUser, function(req, res, next) {
        if (req.user && req.user.herds) {
            // TODO: $elemMatch query to return single element
            req.user.herds.forEach(function(herd) {
                if (herd._id.equals(req.params.herdId)) {
                    return res.json(herd);
                }
            });
        }
        return res.status(404).json(generateNotFoundResponse('user', 'id', req.params.id));
    });

    app.delete('/rest/users/:id/herds/:herdId', deleteHerd);

    app.put('/rest/users/:id/herds/:herdId', addToHerd);

    app.delete('/rest/users/:id/herds/:herdId/:userIdToBeRemoved', removeFromHerd);
};

function getUser(req, res, next) {
    User.findById(req.params.id, function(err, userResult) {
        if (err) {
            console.error(err);
            res.status(500).send('an error occurred');
        }
        req.user = userResult;
        next();
    });
}

function createUser(req, res, next) {
    if (!req.body.first_name) {
        res.status(400).send('first_name required');
        return;
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
            console.error(err);
            res.status(500).send('an error occurred');
        }
        res.location('/rest/users/'+ user._id);
        req.user = user;
        next();
    });
}

function createHerd(req, res, next) {
    if (!req.body.herd_name) {
        res.status(400).send('herd_name required');
        return;
    } else {
        var herdName = req.body.herd_name;
    }

    User.findOneAndUpdate(
        {_id: req.params.id},
        {$push: {herds: {name: herdName}}},
        function(err, user) {
            if (err) {
                console.error(err);
                res.status(500).send('an error occurred');
            }
            res.location('/rest/users/'+ user._id + '/herds');// TODO: This should be the location of the single herd resource, but we don't have the _id. Need to use save to get _id in result.
            req.user = user;
            next();
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
                console.error(err);
                return res.status(500).send('an error occurred');
            }
            if (result.nModified === 1) {
                res.status(200).send();
            } else {
                return res.status(404).json(generateNotFoundResponse('user/herd', 'id', userId + '/' + herd));
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
            console.error(err);
            return res.status(500).send('an error occurred');
        }
        if (userToBeFollowed) {
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
                        console.error(err);
                        return res.status(500).send('an error occurred');
                    }
                    if (userFollowing) {
                        userFollowing.herds.forEach(function(herd) {
                            if (herd._id.toString() === herdId) {
                                herdName = herd.name;
                            }
                        });
                        if (herdName) {
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
                                    console.error(err);
                                    return res.status(500).send('an error occurred');
                                }
                                res.location('/rest/users/' + userFollowed._id + '/followers');// TODO: returning user added followers loc, probably not the right resp
                                return res.status(200).send();
                            });
                        } else {
                            return res.status(404).json(generateNotFoundResponse('herd', 'id', herdId));
                        }
                    } else {
                        return res.status(404).json(generateNotFoundResponse('user/herd', 'id', userIdFollowing + '/' + herdId));
                    }
                }
            );
        } else {
            return res.status(404).json(generateNotFoundResponse('user', 'id', userIdToBeFollowed));
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
                console.error(err);
                return res.status(500).send('an error occurred');
            }
            User.findOne(
                {_id: userIdToBeRemoved},
                function(err, userToBeRemoved) {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('an error occurred');
                    }
                    if (userToBeRemoved) {
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
                                console.error(err);
                                return res.status(500).send('an error occurred');
                            }
                            return res.status(200).send();
                        });
                    } else {
                        return res.status(404).json(generateNotFoundResponse('user', 'id', userIdToBeRemoved));
                    }
                }
            );
        });
}

function generateNotFoundResponse(resource, param, value) {
    return {
        message: 'Could not find ' + resource + ' with ' + param + ' ' + value,
        errorData: {
            propertyName: param,
            invalidId: value
        },
        type: 'INVALID_ID'
    };
}