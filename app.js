const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const engine = require('ejs-mate');
const Joi = require('joi');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const Campground = require('./models/campground');
const { join } = require('path');
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
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
	res.render('home');
});

app.get('/campgrounds', async (req, res) => {
	const campgrounds = await Campground.find({});
	res.render('campgrounds/index', { campgrounds });
});

app.get('/campgrounds/new', (req, res) => {
	res.render('campgrounds/new');
});

app.post('/campgrounds', catchAsync(async (req, res) => {
	//if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
	const campgroundSchema = Joi.object({
		campground: Joi.object({
			title: Joi.string().required(),
			price: Joi.number().required().min(0),
			image: Joi.string().required(),
			location: Joi.string().required(),
			description: Joi.string().required()
		}).required()
	});
	const { error } = campgroundSchema.validate(req.body);
	if(error){
		const msg = error.details.map(el => el.message).join(',');
		throw new ExpressError(msg, 400);
	}
	const campground = new Campground(req.body.campground);
	await campground.save();
	res.redirect(`/campgrounds/${campground._id}`);
}));

app.get('/campgrounds/:id', catchAsync(async (req, res) => {
	const campground = await Campground.findById(req.params.id);
	res.render('campgrounds/show', { campground });
}));

app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
	const campground = await Campground.findById(req.params.id);
	res.render('campgrounds/edit', { campground });
}));

app.put('/campgrounds/:id', catchAsync(async (req, res) => {
	const { id } = req.params;
	const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
	res.redirect(`/campgrounds/${campground._id}`);
}));

app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
	const { id } = req.params;
	await Campground.findByIdAndDelete(id);
	res.redirect('/campgrounds');
}));

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