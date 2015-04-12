var idGenerator = require('../../idGenerator');
var valueType = require('../../valueType');
var DecisionProjection = require('../DecisionProjection');

var SessionId = exports.SessionId = valueType.extends(function SessionId(id){
    this.id = id;
}, function toString() {
    return 'Session:' + this.id;
});

var UserConnected = exports.UserConnected = function UserConnected(sessionId, userIdentityId, connectedAt){
    this.sessionId = sessionId;
    this.userIdentityId = userIdentityId;
    this.connectedAt = connectedAt;

    Object.freeze(this);
};

UserConnected.prototype.getAggregateId = function getAggregateId(){
    return this.sessionId;
};

var UserDisconnected = exports.UserDisconnected = function UserDisconnected(sessionId, userIdentityId){
    this.sessionId = sessionId;
    this.userIdentityId = userIdentityId;

    Object.freeze(this);
};

UserDisconnected.prototype.getAggregateId = function getAggregateId(){
    return this.sessionId;
};

var Session = exports.Session = function Session(events){
    var projection = DecisionProjection.create().register(UserConnected, function(event){
        this.userIdentityId = event.userIdentityId;
        this.sessionId = event.sessionId;
    }).register(UserDisconnected, function(event){
        this.isDisconnected = true;
    }).apply(events);

    this.logOut = function logOut(publishEvent){
        if(projection.isDisconnected){
            return;
        }

        publishEvent(new UserDisconnected(projection.sessionId, projection.userIdentityId));
    };
};

exports.logIn = function logIn(publishEvent, userIdentityId){
    var sessionId = new SessionId(idGenerator.generate());
    publishEvent(new UserConnected(sessionId, userIdentityId, new Date()));

    return sessionId;
};

exports.create = function create(events) {
    return new Session(events);
};