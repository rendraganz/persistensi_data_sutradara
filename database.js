require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

const DBSOURCE = process.env.DB_SOURCE;
const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        // movies
        db.run(`CREATE TABLE IF NOT EXISTS movies (
            id INT PRIMARY KEY,
            title TEXT NOT NULL,
            director TEXT NOT NULL,
            year INT
        );`, (err) => {
            if (err) {
                console.error("Error creating table 'movies':", err.message);
            } else {
                const insert = 'INSERT INTO movies (id, title, director, year) VALUES (?,?,?,?)';
                db.run(insert, [1, "Suami Takut Istri", "Rendra", 2036]);
                db.run(insert, [2, "Tukang Bubur Naik Haji", "Tukang Bubur", 2014]);
                console.log("Table 'movies' already exists.");
            }
        });

        // directors
        db.run(`CREATE TABLE IF NOT EXISTS directors (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            birthYear INT
        );`, (err) => {
            if (err) {
                console.error("Error creating table 'directors':", err.message);
            } else {
                const insert = 'INSERT INTO directors (id, name, birthYear) VALUES (?,?,?)';
                db.run(insert, [1, "Rendra", 2036]);
                db.run(insert, [2, "Tukang Bubur", 2014]);
                console.log("Table 'directors' already exists.");
            }
        });
    }
});
module.exports = db;