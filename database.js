// backend/database.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt'); 

const DBSOURCE = "db.sqlite";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');

        db.serialize(() => {
            // 1. Create Users Table
            db.run(`CREATE TABLE IF NOT EXISTS Users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                address TEXT,
                role TEXT NOT NULL CHECK(role IN ('admin', 'user', 'owner'))
            )`, (err) => {
                if (!err) {
                    console.log("Users table created.");
                    
                    const salt = bcrypt.genSaltSync(10);
                    const adminHash = bcrypt.hashSync("Admin@123", salt);
                    const ownerHash = bcrypt.hashSync("Owner@123", salt);
                    const userHash = bcrypt.hashSync("Alice@123", salt);

                    const insertUser = 'INSERT OR IGNORE INTO Users (name, email, password, address, role) VALUES (?,?,?,?,?)';
                    
                    db.run(insertUser, ["Super Admin", "admin@roxiler.com", adminHash, "Headquarters", "admin"]);
                    db.run(insertUser, ["Steve Jobs", "owner@apple.com", ownerHash, "Cupertino, CA", "owner"]);
                    db.run(insertUser, ["Alice The Customer", "alice@gmail.com", userHash, "New York", "user"]);
                    
                    console.log("Seeded Users.");
                }
            });

            // 2. Create Stores Table (REVERTED: No images column)
            db.run(`CREATE TABLE IF NOT EXISTS Stores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                address TEXT,
                owner_id INTEGER,
                FOREIGN KEY (owner_id) REFERENCES Users(id) ON DELETE CASCADE
            )`, (err) => {
                if (!err) {
                    console.log("Stores table created.");
                    
                    // Seed "The Apple Store" (Simple version)
                    const insertStore = `INSERT OR IGNORE INTO Stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)`;
                    db.run(insertStore, ["The Apple Store", "contact@apple.com", "5th Avenue, New York, NY", 2]);
                    console.log("Seeded Stores.");
                }
            });

            // 3. Create Ratings Table
            db.run(`CREATE TABLE IF NOT EXISTS Ratings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                store_id INTEGER,
                rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (store_id) REFERENCES Stores(id) ON DELETE CASCADE,
                UNIQUE(user_id, store_id)
            )`, (err) => {
                if (!err) {
                    console.log("Ratings table created.");
                    db.run(`INSERT OR IGNORE INTO Ratings (user_id, store_id, rating) VALUES (?, ?, ?)`, [3, 1, 5]); 
                }
            });
        });
    }
});

module.exports = db;