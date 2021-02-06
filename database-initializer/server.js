'use strict';

// Going to connect to MySQL database
const mysql = require('mysql');

const HOST = process.env.DBHOST ? process.env.DBHOST : "127.0.0.1";
const USER = process.env.DBUSER ? process.env.DBUSER : "root";
const PASSWORD = process.env.DBPASSWORD ? process.env.DBPASSWORD : "Letmein!";
const DATABASE = process.env.DBDATABASE ? process.env.DBDATABASE : "events_db";

const connection = mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
});

const create_table_sql = `CREATE TABLE events(
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    event_time VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    likes INT DEFAULT 0,
    datetime_added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ( id ));`

const add_record_sql = `INSERT INTO events (title, event_time, description, location) 
VALUES ('Pet Show', 'June 6 at Noon', 
'Super-fun with furry friends!', 'Reston Dog Park');`

connection.connect(function (err) {
    if (err) {
        console.error(err.message);
    }
    else {
        console.log("Connected!");
        // Ensure the database doesn't exist
        connection.query("DROP DATABASE IF EXISTS events_db;", function (err, result) {
            console.log("Dropped Database");
            // Create the database
            connection.query("CREATE DATABASE events_db;", function (err, result) {
                // Switch to the database
                connection.query("USE events_db;", function (err, result) {
                    console.log("Switched Database");
                    // Create the Table
                    connection.query(create_table_sql, function (err, result) {
                        console.log("Table created");
                        // Add a Record
                        connection.query(add_record_sql, function (err, result) {
                            console.log("Record added");
                            process.exit()
                        });
                    });
                });
            });
        });
    }
});