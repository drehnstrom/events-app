'use strict';

console.log(`process.env.SERVER = ${process.env.SERVER}`);
// express is a nodejs web server
// https://www.npmjs.com/package/express
const express = require('express');

// express.json() is built into Express 4.16+
// https://expressjs.com/en/api/express.html#express.json

// express-handlebars is a templating library 
// https://www.npmjs.com/package/express-handlebars
// - look inside the views folder for the templates
// data is inserted into a template inside {{ }}
const hbs = require('express-handlebars');

// axios is used to make REST calls to the backend microservice
// https://www.npmjs.com/package/axios
const axios = require('axios');

// create the server
const app = express();

// set up handlebars as the templating engine
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
    extname: 'hbs',
    defaultView: 'default'
}));

// Use built-in Express middleware for parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Get environment variables
const SERVER = process.env.SERVER ? process.env.SERVER : "http://localhost:8082";
const BUILDTIME = process.env.BUILDTIME ? process.env.BUILDTIME : "00-00-00";


// defines a route that receives the request to /
app.get('/', async (req, res) => {
    try {
        // make a request to the backend microservice using axios
        // the URL for the backend service should be set in configuration 
        // using an environment variable
        const response = await axios.get(SERVER + '/events');
        const body = response.data;
        
        console.log('statusCode:', response.status); // Print the response status code
        console.log(body); // print the return from the server microservice
        
        res.render('home',
            {
                layout: 'default',  //the outer html page
                template: 'index-template', // the partial view inserted into 
                // {{body}} in the layout - the code
                // in here inserts values from the JSON
                // received from the server
                events: body.events,
                buildtime: BUILDTIME
            }); // pass the data from the server to the template
    } catch (error) {
        console.log('error:', error.message); // Print the error if one occurred
        res.render('error_message',
            {
                layout: 'default',  //the outer html page
                error: error // pass the data from the server to the template
            });
    }
});


// defines a route that receives the post request to /events
app.post('/events', async (req, res) => {
    try {
        // make a request to the backend microservice using axios
        // the URL for the backend service should be set in configuration 
        // using an environment variable
        const response = await axios.post(
            SERVER + '/events',  // the microservice end point for adding an event
            req.body,  // content of the form
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        
        console.log('statusCode:', response.status);
        console.log(response.data); // print the return from the server microservice
        res.redirect("/"); // redirect to the home page
    } catch (error) {
        console.log('error:', error.message);
        res.redirect("/");
    }
});

// create other get and post methods here - version, login,  etc

app.get('/like/:id', async (req, res) => {
    const id = req.params.id;
    try {
        // make a request to the backend microservice using axios
        const response = await axios.get(
            SERVER + '/events/' + id + '?action=like'  // the microservice end point for events
        );
        
        console.log('statusCode:', response.status);
        console.log(response.data); // print the return from the server microservice
        res.json(response.data); // pass the data from the server to the template
    } catch (error) {
        console.log('error:', error.message); // Print the error if one occurred
        res.render('error_message',
            {
                layout: 'default',  //the outer html page
                error: error // pass the data from the server to the template
            });
    }
});




// generic error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message });
});

// specify the port and start listening
const PORT = process.env.PORT ? process.env.PORT : 8080;
const server = app.listen(PORT, () => {
    const host = server.address().address;
    const port = server.address().port;

    console.log(`Events app listening at http://${host}:${port}`);
});

module.exports = app;