const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://dbuser2:uuuth@cluster0.uk2xzib.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
});
const exerciseSchema = new mongoose.Schema({
    user_id: { type: String },
    description: { type: String },
    duration: { type: Number },
    date: { type: Date }
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', async (req, res) => {
    try {
        const newUser = new User({ username: req.body.username });
        const savedUser = await newUser.save();
        console.log(savedUser._id);
        res.send({ username: savedUser.username, _id: savedUser._id });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, '_id username');
        res.send(users);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
    try {
        const user = await User.findById(req.params._id);
        let date = req.body.date && !isNaN(Date.parse(req.body.date)) ? new Date(req.body.date) : new Date();
        const newExercise = new Exercise({ user_id: user._id, description: req.body.description, duration: parseInt(req.body.duration), date: date });
        const savedExercise = await newExercise.save();
        res.send({ username: user.username, description: req.body.description, duration: parseInt(req.body.duration), date: formatDateString(date), _id: user._id });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get("/api/users/:_id/logs", async (req, res) => {
    try {
        let query = { user_id: req.params._id };
        if (req.query.from) {
            query.date = { $gt: new Date(req.query.from) };
        }
        if (req.query.to) {
            if (!query.date) {
                query.date = { $lt: new Date(req.query.to) };
            }
            query.date.$lt = new Date(req.query.to);
        }

        const user = await User.findById(req.params._id);
        let exercises;
        if (req.query.limit) {
            exercises = await Exercise.find(query).limit(parseInt(req.query.limit));
        } else {
            exercises = await Exercise.find(query);
        }
        let logs = [];
        for (let i = 0; i < exercises.length; i++) {
            logs.push({ description: exercises[i].description, duration: exercises[i].duration, date: formatDateString(exercises[i].date) });
        }
        res.send({ username: user.username, count: exercises.length, _id: user._id, log: logs });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

function formatDateString(date) {
    const year = date.getFullYear();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[date.getUTCDay()];
    const monthName = months[date.getUTCMonth()];
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${dayName} ${monthName} ${day} ${year}`;
}

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
