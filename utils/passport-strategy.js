// var FacebookStrategy = require('passport-facebook').Strategy;

// var strategy = {};

// strategy.facebook = new FacebookStrategy({
//   clientID : "653014024831372",
//   clientSecret: "FACEBOOK_APP_SECRET_HERE",
//   callbackURL: "FACEBOOK_APP_CALLBACK_URL_HERE",
//   profileFields: ['id', 'name','picture.type(large)', 'emails', 'gender', 'profileUrl']  
// },
//  function(accessToken, refreshToken, profile, done) {
// User.findOne({ oauthID: profile.id }, function(err, user) {
// if(err) { console.log(err); }
// if (!err && user != null) {
//   done(null, user);
// } else {
//   var user = new User({
//     oauthID: profile.id,
//     name: profile.displayName,
//     created: Date.now()
//   });
//   user.save(function(err) {
//     if(err) {
//       console.log(err);
//     } else {
//       console.log("saving user ...");
//       done(null, user);
//     };
//   });
// };
// });
// }
// );

// // IMPORTANT NOTE: you need to edit this code, is not going to work how it is.


// module.exports = strategy;

// //This file is oriented to add more strategies (google, twitter, github, etc...) all in one place.