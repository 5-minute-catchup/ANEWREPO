var express = require('express'),
    request = require('supertest'),
    mongojs = require("mongojs"),
    mongoose = require('mongoose'),
    chai = require('chai'),
    chaiHttp = require('chai-http'),
    expect = require('chai').expect,
    dbURI = 'mongodb://fmcteam:fmc123@ds031802.mongolab.com:31802/fmcuser',
    db = mongoose.connect(dbURI),
    User = mongoose.model('User', {
      name: String,
      facebookID: String,
      image: String,
      friends: String
    }),
    clearDB  = require('mocha-mongoose')(dbURI, {noClear: true});

// (for mocks of 2 users)
// var user1, user2;

'use strict';
// chai.use(chaihttp);

describe('5 minutes catch-up Mongoose database', function () {

  // after(function(done) {
  //   mongoose.connection.db.dropDatabase(function() {
  //     done();
  //   });
  // });

  xit('exists', function () {
    // expect(db).to.be.ok;
    console.log(db)
    expect(db).to.include.key('name');
    // .expect('Content-Type', /json/);
  });

// Tests API calls from FB login
  xit('if first log in, should create a new user when logging in with Facebook', function(done) {
    chai.request('localhost:3000')
    .post('/account')
    .send({name: 'Testman', facebookID: thetest, image: picture, friends: myfriends})
    .end(function(err, res) {
      expect(err).to.eql(null);
      expect(res).to.have.status(200);
      done();
    });
  });

  xit('should GET a list of users', function(done) {
    chai.request('localhost:3000')
    .get('/')
    .end(function(err, res) {
      expect(err).to.eql(null);
      expect(res).to.have.status(200);
      expect(res.body).to.not.be.empty; //jshint ignore:line
      done();
    });
  });

 // mocking adding 2 users to DB
  // beforeEach(function(done){
  //   global.nss.db.dropDatabase(function(err, result){
  //     user1 = new User({name: 'Guillaume B', facebookId:'whatever1'});
  //     user2 = new User({name: 'Ed OB', facebookId:'whatever2'});
  //     done();
  //   });
  // });

  xit('finds a user by his/her Facebook ID', function(done){
    user1.insert(function(){
      User.findByFacebookId(user1.facebookId, function(id){
        expect(id.facebookId).to.equal('whatever 1');
        done();
      });
    });
  });

  xit('can retrieve the facebook profile picture of a logged-in user', function(done){
  });

  xit('can retrieve the facebook friends list of a logged-in user', function(done){
  });

});