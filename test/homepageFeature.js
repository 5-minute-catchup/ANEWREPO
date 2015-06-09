var chai = require('chai');
var expect = chai.expect;
var server = require('../server.js');

 before(function(){
    casper.start('http://localhost:3000/');
  });
  
  it('hello worlds', function(){
    casper.then(function(){
      expect("#title").to.have.text("Five Minute Catchup");
    });
  });

  xit('tells a user to sign in', function(){

  });

  xit('log in via facebook', function(){

  });

  xit('a map should appear', function(){

  })
});
