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

// get movie dari id
app.get('/movies/:id', (req, res) => {
    const sql = "SELECT * FROM movies WHERE id = ?";
    db.get(sql, [req.params.id], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(row);
    });
});

// tambah movie
app.post('/movies', (req, res) => {
    const { title, director, year } = req.body;
    const sql = "INSERT INTO movies (title, director, year) VALUES (?,?,?)";
    db.run(sql, [title, director, year], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, title, director, year });
    });
});

// update movie by id
app.put('/movies/:id', (req, res) => {
    const { title, director, year } = req.body;
    const sql = "UPDATE movies SET title = ?, director = ?, year = ? WHERE id = ?";
    db.run(sql, [title, director, year, req.params.id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ updatedID: req.params.id, title, director, year });
    });
});

// hapus movie
app.delete('/movies/:id', (req, res) => {
    const sql = "DELETE FROM movies WHERE id = ?";
    db.run(sql, [req.params.id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ deletedID: req.params.id });
    });
});

// menampilkan semua director
app.get('/directors', (req, res) => {
    const sql = "SELECT * FROM directors ORDER BY id ASC;";
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

// get director dari id
app.get('/directors/:id', (req, res) => {
    const sql = "SELECT * FROM directors WHERE id = ?";
    db.get(sql, [req.params.id], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(row);
    });
});

// menambah director
app.post('/directors', (req, res) => {
    const { name, birthYear } = req.body;
    const sql = "INSERT INTO directors (name, birthYear) VALUES (?,?)";
    db.run(sql, [name, birthYear], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, name, birthYear });
    });
});


// update director 
app.put('/directors/:id', (req, res) => {
    const { name, birthYear } = req.body;
    const sql = "UPDATE directors SET name = ?, birthYear = ? WHERE id = ?";
    db.run(sql, [name, birthYear, req.params.id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ updatedID: req.params.id, name, birthYear });
    });
});

// hapus id
app.delete('/directors/:id', (req, res) => {
    const sql = "DELETE FROM directors WHERE id = ?";
    db.run(sql, [req.params.id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ deletedID: req.params.id });
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