const passport = require('passport');
const moongose = require('mongoose');
const User = moongose.model('User');
const crypto =  require('crypto');
const promisify  = require('es6-promisify');
const mail =  require('../handlers/mail');

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login!',
    successFlash: 'You are now logged in!',
    successRedirect: '/'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are successfully logged out!');
    res.redirect('/');
}

exports.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Oops you must be logged in to do that!');
    res.redirect('/login');
}

exports.forgot = async (req, res) => {
    const user = await User.findOne({ email: req.body.email })
    if(!user) {
        req.flash('error', 'User with that account doesn\'t exists');
        res.redirect('/login');
    }

    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    await mail.send({
        user,
        subject: 'Password reset mail',
        resetUrl,
        filename: 'password-reset'
    })
    req.flash('success', `You have been emailed a password link`);

    res.redirect('/login');
}

exports.reset = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt : Date.now()}
    });
    if(!user) {
        req.flash("error",'Password reset is invalid or expired');
        return res.redirect('/login');
    }
    res.render('reset', { title: 'Reset Your Password' });
}

exports.confirmedPasswords = (req, res, next) => {
    if(req.body.password === req.body['confirm-password']) {
        return next();
    }
    req.flash('error', 'Passwords do not match');
    res.redirect('back');

}
exports.update = async (req, res) => {
     const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt : Date.now()}
    });
    if(!user) {
        req.flash("error",'Password reset is invalid or expired');
        return res.redirect('/login');
    }

    const setPassword  = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordExpires = undefined;
    user.resetPasswordToken = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash('success', 'Nice, your password has been reset');
    res.redirect('/');
}