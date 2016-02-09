var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({ //_type and _id columns are automatically created
  tableName: "users",
  timeStamps: true,
  initalize: function(){
    this.on('creating', function(model, attr, options){
      bcrypt.hash(attr.password, null, null, function(error, hash) {
        model.set('password', hash)
      });
    });
    // this.on('fetching', function(model, columns, options){
    // })
  },
  link: function() {
    return this.hasMany(Link);
  }
});

module.exports = User;  