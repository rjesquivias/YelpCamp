const express = require('express');
const mongoose = require('mongoose');
const engine = require('ejs-mate');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const { join } = require('path');
const campgrounds = require('./routes/campgrounds');
const reviews = require('./routes/reviews');
require('dotenv/config');

mongoose.connect(process.env.DB_CONNECTION, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useUnifiedTopology: true,
	useFindAndModify: false
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
	console.log('Database connected');
});

const app = express();

app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use('/campgrounds', campgrounds);
app.use('/campgrounds/:id/reviews', reviews);

app.get('/', (req, res) => {
	res.render('home');
});

app.all('*', (req, res, next) => {
	next(new ExpressError('Page not found', 404));
});

app.use((err, req, res, next) => {
	const { statusCode = 500 } = err;
	if(!err.message) err.message = 'Something went wrong';
	res.status(statusCode).render('error', { err });
});

app.listen(3000, () => {
	console.log('Serving on port 3000');
});