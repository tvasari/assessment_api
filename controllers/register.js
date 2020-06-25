const handleRegister = (req, res, db, bcrypt, jwt, sgMail) => {

	const { email, name, password } = req.body;
	if (!email || !name || !password) {
		return res.status(400).json('incorrect for submission');
	}

	const hash = bcrypt.hashSync(password);

	db.transaction(trx => {
		trx.insert({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
				.returning('*')
				.insert({
					email: loginEmail[0],
					name: name				
				})
				.then(user => {
					res.json(user[0])
				})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err => res.status(400).json('unable to register'));

	const emailToken = jwt.sign({
		user: email
	}, 'secret4algorithm', {
		expiresIn: '1d'
	});

	const url = `https://morning-castle-assessment-api.herokuapp.com/confirmation/${emailToken}`;

	const mailOptions = {
		from: 'tommaso.vsr@gmail.com',
		to: email,
		subject: 'Email di conferma',
		html: `Clicca sul link per confermare l'indirizzo email del tuo profilo: <a href="${url}">${url}</a>`
	};

	const sendgridAPIKey = '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';

	sgMail.setApiKey(sendgridAPIKey);
	sgMail.send(mailOptions)
}

module.exports = {
	handleRegister: handleRegister
};