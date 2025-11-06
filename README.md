## **Nama**: Muhammad Rendra Irawan_2D TRPL
## **NIM**: 362458302036
## **kelas**: 2D TRPL

### Praktikum 3 || Persistensi Data Saudara
1. Lampiran Json
- ![file json](media/Persistensi%20Sutradara%20Rendra%20TRPL%202D.postman_collection.json)

### Praktikum Modul 5 || PengamananAPI-Autentikasi dan Autorisasi dengan JWT

1. Terapkan middleware ```authenticateToken``` ke endpoint berikut:
- **POST** ```/directors``` tanpa token
![post directors tanpa token](media/post_directors_tanpa_token.png)

- **POST** ```/directors``` dengan token
![post directors dengan token](media/post_directors_dengan_token.png)

- **PUT** ```/directors/:id``` tanpa token
![put directors tanpa token](media/put_directors_tanpa_token.png)

- **PUT** ```/directors/:id``` dengan token
![put directors dengan token](media/put_directors_dengan_token.png)

- **DELETE** ```/directors/:id``` tanpa token
![delete directors tanpa token](media/delete_directors_tanpa_token.png)

- **DELETE** ```/directors/:id``` dengan token
![delete directors dengan token](media/delete_directors_dengan_token.png)

2. Biarkan endpoint GET ```/directors``` dan GET ```/directors/:id``` tetap publik.
````
app.get('/directors', (req, res) => {
    const sql = "SELECT * FROM directors ORDER BY id ASC;";
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});
````

````
app.get('/directors/:id', (req, res) => {
    const sql = "SELECT * FROM directors WHERE id = ?";
    db.get(sql, [req.params.id], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(row);
    });
});
````



3. Lampiran Json
- ![file json update](media/Rendra%20Praktikum%20Authorization.postman_collection.json)