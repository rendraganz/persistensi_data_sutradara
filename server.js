require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');

// impor bcrypt dan JWT_SECRET
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;


// lain
const authenticateToken = require('./middleware/authMiddleware');

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
app.post('/movies', authenticateToken, (req, res) => {
    const { title, director, year } = req.body;
    const sql = "INSERT INTO movies (title, director, year) VALUES (?,?,?)";
    db.run(sql, [title, director, year], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, title, director, year });
    });
});

// update movie by id
app.put('/movies/:id', authenticateToken, (req, res) => {
    const { title, director, year } = req.body;
    const sql = "UPDATE movies SET title = ?, director = ?, year = ? WHERE id = ?";
    db.run(sql, [title, director, year, req.params.id], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ updatedID: req.params.id, title, director, year });
    });
});

// hapus movie
app.delete('/movies/:id', authenticateToken, (req, res) => {
    const sql = "DELETE FROM movies WHERE id = ?";
    db.run(sql, [req.params.id], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ deletedID: req.params.id });
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
app.post('/directors', authenticateToken, (req, res) => {
    const { name, birthYear } = req.body;
    const sql = "INSERT INTO directors (name, birthYear) VALUES (?,?)";
    db.run(sql, [name, birthYear], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, name, birthYear });
    });
});


// update director 
app.put('/directors/:id', authenticateToken, (req, res) => {
    const { name, birthYear } = req.body;
    const sql = "UPDATE directors SET name = ?, birthYear = ? WHERE id = ?";
    db.run(sql, [name, birthYear, req.params.id], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ updatedID: req.params.id, name, birthYear });
    });
});

// hapus id
app.delete('/directors/:id', authenticateToken, (req, res) => {
    const sql = "DELETE FROM directors WHERE id = ?";
    db.run(sql, [req.params.id], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ deletedID: req.params.id });
    });
});

// profile
app.get('/profile', authenticateToken, (req, res) => {
    const sql = "SELECT * FROM users;";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json(rows);
    });
})

// auth routes
app.post('/auth/register', (req, res) => {
    const {username, password} = req.body;
    if (!username || !password || password.length < 6) {
        return res.status(400).json({error: 'Username dan password (min 6 char) harus diisi'});
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error("Error hashing:", err);
            return res.status(500).json({error: 'Gagal memproses pendaftaran'});
        }

        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        const params = [username.toLowerCase(), hashedPassword];
        db.run(sql, params, function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint')) {
                    return res.status(409).json({error: 'Username sudah digunakan'});
                }
                console.error("Error inserting user:", err);
                return res.status(500).json({error: 'Gagal menyimpan pengguna'});
            }
            res.status(201).json({message: 'Registrasi berhasil', userId: this.lastID});
        });
    });
});

// /auth/login
app.post('/auth/login', (req, res) => {
    const {username, password} = req.body;
    if (!username || !password) {
        return res.status(400).json ({error: 'Username dan password harus diisi'});
    }

    const sql = "SELECT * FROM users WHERE username = ?";
    db.get(sql, [username.toLowerCase()], (err, user) => {
        if (err || !user) {
            return res.status(401).json ({error: 'Kredensial tidak valid'});
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(401).json ({error: 'Kredensial tidak valid'});
            }

            const payload = {user: {id: user.id, username: user.username}};

            jwt.sign (payload, JWT_SECRET, {expiresIn: '1h'}, (err, token) => {
                if (err) {
                    console.error("Error signing token:", err);
                    return res.status(500).json ({error: 'Gagal membuat token'});
                }
                res.json({message: 'Login berhasil', token: token});
            });
        });
    });
});

// post auth
// app.post('/movies', authenticateToken, (req, res)=> {
//     console.log('Request POST /movies oleh user:', req.user.username);
//     const {id, username, password} = req.body;
//     const sql = "INSERT INTO movies (id, username, password) VALUES (?, ?, ?)";
//     db.run(sql, [id, username, password], function(err) {
//         if (err) return res.status(401).json({ error: err.message});
//         res.json({id: this.lastID, username, password });
//     });
// });

// put auth
// app.put('/movies/id', authenticateToken, (req, res) => {
//     const {id, username, password} = req.body;
//     const sql = "UPDATE movies SET id = ?, username = ?, password = ? WHERE id = ?";
//     db.run(sql, [id, username, password, req.params.id], function(err) {
//         if (err) return res.status(400).json({ error: err.message});
//         res.json({updatedID: req.params.id, username, password});
//     });
// });

// delete auth
// app.delete('/movies/id', authenticateToken, (req, res) => {
//     const sql = "DELETE FROM movies WHERE id = ?";
//     db.run(sql, [req.params.id], function(err) {
//         if (err) return res.status(400).json({error: err.message});
//         res.json({ deletedID: req.params.id});
//     });
// });

//handle 404
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

//information server listening
app.listen(port, () => {
    console.log(`Server Running on localhost: ${port}`);
});