require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, authorizeRole } = require('./middleware/auth.js');

constapp = express();
constPORT = process.env.PORT || 3036;
constJWT_SECRET = process.env.JWT_SECRET;

// middleware
app.use(cors());
app.use(express.json());

//routes
app.get('/status', (req, res) => {
    res.json({ ok: true, service: 'film-api' });
});

//auth routes
app.post('/auth/register', async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
        return res.status(400).json({ error: 'Username dan password (min 6 char) harus diisi' });
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const sql = 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username';
        const result = await db.query(sql, [username.toLowerCase(), hashedPassword, 'user']);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Username sudah digunakan' });
        }
        next(err);
    }
});

app.post('/auth/register-admin', async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
        return res.status(400).json({ error: 'Username dan password (min 6 char) harus diisi' });
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const sql = 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username';
        const result = await db.query(sql, [username.toLowerCase(), hashedPassword, 'admin']);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Username sudah digunakan' });
        }
        next(err);
    }
});

app.post('auth/login', async (req, res, next) => {
    const {username, password} = req.body;
        try {
            const sql = "SELECT * FROM users WHERE username = $1";
            const result = await db.query(sql, [username.toLowerCase()]);
            const user = result.rows[0];
            if (!user) {
                return res.status(401).json({error: 'Kredensial tidak valid'});
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({error: 'Kredensial tidak valid'});
            }
            const payload = {user: {id: user.id, username: user.username, role: user.role}};
            const token = jwt.sign(payload, JWT_SECRET, {expiresIn: 'lh'});
            res.json({message: 'Login berhasil', token: token});
        } catch (err) {
            next(err);
        }
});

//movies routes
app.get('/movies', async (req, res, next)=> {
    const sql = `SELECT m.id, m.title, m.year, d.id AS directors_id, d.name AS director_name
    FROM movies m
    LEFT JOIN directors d ON m.directors_id = d.id
    ORDER BY m.id ASC
    `;
    try {
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        next (err);
    }
});

app.get('/movies/:id', async (req, res, next)=> {
    const sql = `SELECT m.id, m.title, m.year, d.id AS directors_id, d.name AS director_name
    FROM movies menambah
    LEFT JOIN directors d ON m.directors_id = d.id
    WHERE m.id = $1
    `;
    try {
        const result = await db.query(sql, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({error: 'Film tidak ditemukan'});
        }
        res.json(result.rows[0]);
    } catch (err) {
        next (err);
    }
});

app.post('/movies', authenticateToken, async (req, res, next) => {
    const {title, directors_id, year} = req.body;
    if (!title || !directors_id || !year) {
        return res.status(400).json({ error: 'title, directors_id, year wajib diisi'});
    }
    const sql = 'INSERT INTO movies (title, directors_id, year) VALUES ($1, $2, $3) RETURNING *';
    try {
        const result = await db.query(sql, [title, directors_id, year]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

app.put('/movies/:id', [authenticateToken, authorizeRole('admin')], async (req, res, next)=> {
    const {title, directors_id, year} = req.body;
    const sql = 'UPDATE movies SET title = $1, directors_id = $2, year = $3 WHERE id = $4 RETURNING *';
    try {
        const result = await db.query(sql, [title, dierectors_id, year, req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({error: 'Film tidak ditemukan'});
        }
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

app.delete('/movies/:id', [authenticateToken, authorizeRole('admin')], async (req, res, next) => {
    const sql = 'DELETE FROM movies WHERE id = $1 RETURNING *';
    try {
        const result = await db.query(sql, [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json ({error: 'Film tida ditemukan'});
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// directors routes

// fallback & error
app.use((req, res) => {
    res.status(404).json({error: 'Rute tidak ditemukan'});
});

app.use((err, req, res, next)=> {
    console.error('[SERVER ERROR]', err.stack);
    res.status(500).json({error: 'Terjadi kesalahan pada server'});
});

app.listen (PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


// persistensi data sutradara
// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const db = require('./database');

// // impor bcrypt dan JWT_SECRET
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const JWT_SECRET = process.env.JWT_SECRET;


// // lain
// const {authenticateToken, authorizeRole} = require('./middleware/auth.js');
// const { error } = require('console');

// const app = express();
// const port = process.env.PORT;
// app.use(cors());

// // const port = 3100;

// //middleware data
// app.use(express.json());

// let director = [
//     { id: 1, name: 'Peter Jackson' },
//     { id: 2, name: 'Peter Jackson' },
//     { id: 3, name: 'Peter Jackson' },
// ];

// // console.log(movies);

// //routes

// app.get('/', (req, res) => {
//     res.json({
//         ok: true,
//         service: 'Praktikum 3 Rendra 2D',
//         time: new Date().toISOString()
//     });
// });

// app.get('/status', (req, res) => {
//         res.json({
//             status: 'OK',
//             message: 'Server is running',
//             timestamp: new Date().toISOString
//         });
//     }
// );

// app.get('/movies', (req, res) => {
//     const sql = "SELECT * FROM movies ORDER BY id ASC;";
//     db.all(sql, [], (err, rows) => {
//         if (err) {
//             return res.status(400).json({ "error": err.message });
//         }
//         res.json(rows);
//     });
// });

// // get movie dari id
// app.get('/movies/:id', (req, res) => {
//     const sql = "SELECT * FROM movies WHERE id = ?";
//     db.get(sql, [req.params.id], (err, row) => {
//         if (err) return res.status(400).json({ error: err.message });
//         res.json(row);
//     });
// });

// // tambah movie
// app.post('/movies', authenticateToken, (req, res) => {
//     const { title, director, year } = req.body;
//     const sql = "INSERT INTO movies (title, director, year) VALUES (?,?,?)";
//     db.run(sql, [title, director, year], function(err) {
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(201).json({ id: this.lastID, title, director, year });
//     });
// });

// // update movie by id
// app.put('/movies/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
//     const { title, director, year } = req.body;
//     const sql = "UPDATE movies SET title = ?, director = ?, year = ? WHERE id = ?";
//     db.run(sql, [title, director, year, req.params.id], function(err) {
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(201).json({ updatedID: req.params.id, title, director, year });
//     });
// });

// // hapus movie
// app.delete('/movies/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
//     const sql = "DELETE FROM movies WHERE id = ?";
//     db.run(sql, [req.params.id], function(err) {
//         if (err) {
//             return res.status(403).json({ error: err.message });
//         }
//         console.log(`${req.params.id}`);
//         res.sendStatus(204);
//         // res.status(201).json({ deletedID: req.params.id });
//     });
// });

// // menampilkan semua director
// app.get('/directors', (req, res) => {
//     const sql = "SELECT * FROM directors ORDER BY id ASC;";
//     db.all(sql, [], (err, rows) => {
//         if (err) return res.status(400).json({ error: err.message });
//         res.json(rows);
//     });
// });

// // get director dari id
// app.get('/directors/:id', (req, res) => {
//     const sql = "SELECT * FROM directors WHERE id = ?";
//     db.get(sql, [req.params.id], (err, row) => {
//         if (err) return res.status(400).json({ error: err.message });
//         res.json(row);
//     });
// });

// // menambah director
// app.post('/directors', authenticateToken, (req, res) => {
//     const { name, birthYear } = req.body;
//     const sql = "INSERT INTO directors (name, birthYear) VALUES (?,?)";
//     db.run(sql, [name, birthYear], function(err) {
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(201).json({ id: this.lastID, name, birthYear });
//     });
// });


// // update director
// app.put('/directors/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
//     const { name, birthYear } = req.body;
//     const sql = "UPDATE directors SET name = ?, birthYear = ? WHERE id = ?";
//     db.run(sql, [name, birthYear, req.params.id], function(err) {
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(201).json({ updatedID: req.params.id, name, birthYear });
//     });
// });

// // hapus id
// app.delete('/directors/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
//     const sql = "DELETE FROM directors WHERE id = ?";
//     db.run(sql, [req.params.id], function(err) {
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         console.log(`${req.params.id}`);
//         res.sendStatus(204);
//         // res.status(201).json({ deletedID: req.params.id });
//     });
// });

// // profile
// app.get('/profile', authenticateToken, (req, res) => {
//     const sql = "SELECT * FROM users;";
//     db.all(sql, [], (err, rows) => {
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(201).json(rows);
//     });
// })

// // membuat admin
// app.post('/auth/register-admin', (req, res) => {
//     const {username, password} = req.body;
//     if (!username || !password || password.length < 6) {
//         return res.status(400).json({error: 'Username dan password (min 6 char) harus diisi'});
//     }

//     bcrypt.hash(password, 10, (err, hashedPassword) => {
//         if (err) {
//             console.error("Error hashing:", err);
//             return res.status(500).json({error: 'Gagal memproses pendaftaran'});
//         }

//         const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
//         const params = [username.toLowerCase(), hashedPassword, 'admin'];
//         db.run(sql, params, function(err) {
//             if (err) {
//                 if (err.message.includes('UNIQUE constraint')) {
//                     return res.status(409).json({error: 'Username admin sudah ada'});
//                 }
//                 console.error("Error inserting admin:", err);
//                 return res.status(500).json({error: err.message});
//             }
//             res.status(201).json({message: 'Admin berhasil dibuat', userId: this.lastID});
//         });
//     });
// });

// // auth routes
// app.post('/auth/register', (req, res) => {
//     const {username, password} = req.body;
//     if (!username || !password || password.length < 6) {
//         return res.status(400).json({error: 'Username dan password (min 6 char) harus diisi'});
//     }

//     bcrypt.hash(password, 10, (err, hashedPassword) => {
//         if (err) {
//             console.error("Error hashing:", err);
//             return res.status(500).json({error: 'Gagal memproses pendaftaran'});
//         }

//         const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
//         const params = [username.toLowerCase(), hashedPassword, 'user'];
//         db.run(sql, params, function(err) {
//             if (err) {
//                 if (err.message.includes('UNIQUE constraint')) {
//                     return res.status(409).json({error: 'Username sudah digunakan'});
//                 }
//                 console.error("Error inserting user:", err);
//                 return res.status(500).json({error: 'Gagal menyimpan pengguna'});
//             }
//             res.status(201).json({message: 'Registrasi berhasil', userId: this.lastID});
//         });
//     });
// });

// // /auth/login
// app.post('/auth/login', (req, res) => {
//     const {username, password} = req.body;
//     if (!username || !password) {
//         return res.status(400).json ({error: 'Username dan password harus diisi'});
//     }

//     const sql = "SELECT * FROM users WHERE username = ?";
//     db.get(sql, [username.toLowerCase()], (err, user) => {
//         if (err || !user) {
//             return res.status(401).json ({error: 'Kredensial tidak valid'});
//         }

//         bcrypt.compare(password, user.password, (err, isMatch) => {
//             if (err || !isMatch) {
//                 return res.status(401).json ({error: 'Kredensial tidak valid'});
//             }

//             const payload = {user: {
//                 id: user.id,
//                 username: user.username,
//                 role: user.role
//             }};

//             jwt.sign (payload, JWT_SECRET, {expiresIn: '1h'}, (err, token) => {
//                 if (err) {
//                     console.error("Error signing token:", err);
//                     return res.status(500).json ({error: 'Gagal membuat token'});
//                 }
//                 res.json({message: 'Login berhasil', token: token});
//             });
//         });
//     });
// });

// // post auth
// // app.post('/movies', authenticateToken, (req, res)=> {
// //     console.log('Request POST /movies oleh user:', req.user.username);
// //     const {id, username, password} = req.body;
// //     const sql = "INSERT INTO movies (id, username, password) VALUES (?, ?, ?)";
// //     db.run(sql, [id, username, password], function(err) {
// //         if (err) return res.status(401).json({ error: err.message});
// //         res.json({id: this.lastID, username, password });
// //     });
// // });

// // put auth
// // app.put('/movies/id', authenticateToken, (req, res) => {
// //     const {id, username, password} = req.body;
// //     const sql = "UPDATE movies SET id = ?, username = ?, password = ? WHERE id = ?";
// //     db.run(sql, [id, username, password, req.params.id], function(err) {
// //         if (err) return res.status(400).json({ error: err.message});
// //         res.json({updatedID: req.params.id, username, password});
// //     });
// // });

// // delete auth
// // app.delete('/movies/id', authenticateToken, (req, res) => {
// //     const sql = "DELETE FROM movies WHERE id = ?";
// //     db.run(sql, [req.params.id], function(err) {
// //         if (err) return res.status(400).json({error: err.message});
// //         res.json({ deletedID: req.params.id});
// //     });
// // });

// //handle 404
// app.use((req, res) => {
//     res.status(404).json({ error: "Route not found" });
// });

// //information server listening
// app.listen(port, () => {
//     console.log(`Server Running on localhost: ${port}`);
// });