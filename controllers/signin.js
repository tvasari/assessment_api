const handleSignIn = (req, res, db , bcrypt) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return res.status(400).json('incorrect for submission');
	}
	db('login').select('email', 'hash', 'confirmed')
	  .where(db.raw('?? = ?', ['email', email]))
	  .then(data => {
		const isValid = bcrypt.compareSync(password, data[0].hash);
		if (isValid) {
			if (data[0].confirmed === true ) {
				return db.select('*').from('users')
					.where(db.raw('?? = ?', ['email', email]))
					.then(user => {
						res.json(user[0])
					})
					.catch(err => res.status(400).json("impossibile caricare l'utente."))
			} else {
				res.status(400).json('profilo ancora non convalidato.')
			}
		} else {
			res.status(400).json('username o password errati.')
		}
	  })
	  .catch(err => res.status(400).json('username o password errati.'))
}

module.exports = {
	handleSignIn: handleSignIn
};