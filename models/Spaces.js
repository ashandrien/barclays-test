// Spaces.js

var mongoose = require('mongoose');
mongoose.set('debug', true);

var SpaceSchema = new mongoose.Schema({
	user: Number,
	position: String,
	timeIn: String,
	timeLeave: String,
	taken: Boolean,
});

SpaceSchema.methods.clockIn = function(space) {
	this.user = space.user;
	this.taken = true;
	this.timeLeave = space.timeLeave;
	this.timeIn = Date.now().toString();
	this.save(space);
};

SpaceSchema.methods.leave = function(space) {
	this.user = '';
	this.taken = false;
	this.timeLeave = ''
	this.timeIn = Date.now().toString();
	this.save(space);
};

// PostSchema.methods.parkIt = function(bool, timeOut) {
//   this.taken = bool,
//   this.timeIn = timeOut,
// };

mongoose.model('Space', SpaceSchema);