// Members.js

var mongoose = require('mongoose');

var MemberSchema = new mongoose.Schema({
  memberNo: String,
});

mongoose.model('Member', MemberSchema);