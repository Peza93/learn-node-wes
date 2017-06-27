const mongoose =  require('mongoose');
const Shema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userShema = new Shema ({
    email: {
        type: String,
        unique: true,
        required: 'Please supply an email address',
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid Email Address']
    },
    name: {
        type: String,
        required: 'Please supply a name',
        trim: true
    },
    resetPasswordExpires: Date,
    resetPasswordToken: String,
    hearts: [
        { type: mongoose.Schema.ObjectId, ref: 'Store'}
    ]
});
userShema.virtual('gravatar').get(function() {
    console.log(this.email);
    const hash = md5(this.email);
    return `https://gravatar.com/avatar/${hash}?s=200`;
})
userShema.plugin(passportLocalMongoose, { usernameField: 'email'});
userShema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userShema);