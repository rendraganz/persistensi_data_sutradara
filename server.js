require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const app = express();
const port = process.env.PORT;
app.use(cors());

// const port = 3100;

//middleware data
app.use(express.json());

let director = [
    { id: 1, name: 'Peter Jackson' },
    { id: 2, name: 'Peter Jackson' },
    { id: 3, name: 'Peter Jackson' },
];

// console.log(movies);

//routes

app.get('/', (req, res) => {
    res.json({
        ok: true,
        service: 'Praktikum 3 Rendra 2D',
        time: new Date().toISOString()
    });
});

app.get('/status', (req, res) => {
        res.json({
            status: 'OK',
            message: 'Server is running',
            timestamp: new Date().toISOString
        });
    }
);

app.get('/movies', (req, res) => {
    const sql = "SELECT * FROM movies ORDER BY id ASC;";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        res.json(rows);
    });
});

//handle 404
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

//information server listening
app.listen(port, () => {
    console.log(`Server Running on localhost: ${port}`);
});