'use strict';

// express is a nodejs web server
// https://www.npmjs.com/package/express
const express = require('express');

// converts content in the request into parameter req.body
// https://www.npmjs.com/package/body-parser
const bodyParser = require('body-parser');

// create the server
const app = express();

// the backend server will parse json, not a form request
app.use(bodyParser.json());

// Going to connect to MySQL database
const mysql = require('mysql');

const HOST = process.env.DBHOST ? process.env.DBHOST : "database-server-mariadb.default.svc.cluster.local";
const USER = process.env.DBUSER ? process.env.DBUSER : "";
const PASSWORD = process.env.DBPASSWORD ? process.env.DBPASSWORD : "";
const DATABASE = process.env.DBDATABASE ? process.env.DBDATABASE : "events_db";

const connection = mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    database: DATABASE
});

// mock events data - Once deployed the data will come from database
const mockEvents = {
    events: [
        { id: 1, title: 'Mock Pet Show', event_time: 'June 6 at Noon', description: 'Super-fun with furry friends!', location: 'Reston Dog Park', likes: 0 },
        { id: 2, title: 'Mock Company Picnic', event_time: '4th of July', description: 'Come for free food and drinks.', location: 'At the lake', likes: 0 },
    ]
};

const dbEvents = { events: [] };

// health endpoint - returns an empty array
app.get('/', (req, res) => {
    res.json([]);
});

// version endpoint to provide easy convient method to demonstrating tests pass/fail
app.get('/version', (req, res) => {
    res.json({ version: '1.0.2' });
});


// mock events endpoint. this would be replaced by a call to a datastore
// if you went on to develop this as a real application.
app.get('/events', (req, res) => {
    const sql = 'SELECT id, title, event_time, description, location, likes FROM events;'
    connection.query(sql, function (err, result, fields) {
        // if any error while executing above query, throw error
        if (err) {
            console.error("err")
            res.json(mockEvents);
        }
        else {
            // if there is no error, you have the result
            // iterate for all the rows in result
            Object.keys(result).forEach(function (key) {
                const row = result[key];
                const ev = {
                    title: row.title,
                    event_time: row.event_time,
                    description: row.description,
                    location: row.location,
                    id: row.id,
                    likes: row.likes
                }
                dbEvents.events.push(ev);
            });
            res.json(dbEvents);
        }
    });
});

// Adds an event - in a real solution, this would insert into a cloud datastore.
// Currently this simply adds an event to the mock array in memory
// this will produce unexpected behavior in a stateless kubernetes cluster. 
app.post('/event', (req, res) => {
    // create a new object from the json data and add an id
    const ev = {
        title: req.body.title,
        event_time: req.body.event_time,
        description: req.body.description,
        location: req.body.location,
        id: mockEvents.events.length + 1,
        likes: 0
    }
    // add to the mock array
    mockEvents.events.push(ev);
    // return the complete array
    res.json(mockEvents);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message });
});

const PORT = 8082;
const server = app.listen(PORT, () => {
    const host = server.address().address;
    const port = server.address().port;

    console.log(`Events app listening at http://${host}:${port}`);
});

module.exports = app;