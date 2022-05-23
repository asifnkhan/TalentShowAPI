const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dbConnection = require('./helpers/db-connection');
const userRoute = require('./routes/user.route');
const swaggerRoute = require('./helpers/swagger');
const logger = require('morgan');

app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

// connect to the database
const connection = dbConnection.connect('mongodb://localhost/talent-shows');
connection.then(() => {
    console.log('Connected to the database');
    // Create gridfs bucket when connected
    dbConnection.setupGridFS('videos');
    console.log('Bucket created');
}).catch((err) => {
    console.log('Error connecting to the database: ', err);
});

app.use(cookieParser());
app.use(express.json());
app.use(logger('combined'));

app.get('/', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
        <h1>Welcome to Talent Shows</h1>
        <p>This is a sample application for Talent Shows</p>

        <h2>Uage:</h2>

        <p>To register a user:</p>
        <pre>
            POST /users/register
            {
                "fullName": "John Doe",
                "email": "
                "password": "password",
                "dob": "01/01/1990",
                "address": "123 Main St"
            }
        </pre>

        <p>To login a user:</p>
        <pre>
            POST /users/login
            {
                "email": "
                "password": "password"
            }
        </pre>

        <p>To get all users:</p>
        <pre>
            GET /users
        </pre>

        <p>To apply with a video:</p>
        <pre>
            POST /users/apply
            Content-Type: multipart/form-data
            Max file size: 100MB
            File Type: video/*
            {
                "video": "video.mp4"
            }
        </pre>
    `);
});

// swagger docs route
app.use('/api-docs', swaggerRoute);
app.use('/users', userRoute);

module.exports = app;