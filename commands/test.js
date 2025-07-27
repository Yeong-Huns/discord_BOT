require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../schema/user.schema');

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URI);

async function test() {
	const user = await User.find({ serverId: '887706903336075345'})

	console.log(user);
}


test();