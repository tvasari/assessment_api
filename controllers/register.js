const handleRegister = (req, res, db, bcrypt, jwt, nodemailer) => {

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

	try {
		const emailToken = jwt.sign({
			user: email
		}, 'secret4algorithm', {
			expiresIn: '1d'
		});
	
		const url = `https://morning-castle-assessment-api.herokuapp.com/${emailToken}`;
	
		const transporter = nodemailer.createTransport({
			pool: true,
			host: 'smtp.gmail.com',
			port: 465,
			secure: true,
			service: 'Gmail',
			auth: {
				type: 'OAuth2',
				user: 'tommaso.vsr@gmail.com',
				accessToken: 'ya29.a0AfH6SMCdDqOrfz2H0L0S4N8aUgYno5lPZzD2RwUtM5eEiIc-PiTIbU0nLn_JnIvN-UmarGuAhJdXqcWQxC_YsUmSc_bwRxnUJY__FmmHIeoAOa_6M_8fEyIBIGZQtGsvYtcShgkwo2DF-wt1G8hfx3gsZk_Mg6qhSHQ',
			}
		});
		transporter.sendMail({
			to: email,
			subject: 'Email di conferma',
			html: `Clicca sul link per confermare l'indirizzo email del tuo profilo: <a href="${url}">${url}</a>`
		});
	} catch (e) {
		console.log(e);
	}
}

module.exports = {
	handleRegister: handleRegister
};