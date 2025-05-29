'use strict';
// Mengaktifkan strict mode agar penulisan kode lebih aman dan error lebih mudah terdeteksi.

const fs = require('fs'); 
// Mengimpor modul fs untuk membaca file dan direktori.

const path = require('path');
// Mengimpor modul path untuk mengelola path file/direktori.

const Sequelize = require('sequelize');
// Mengimpor library Sequelize sebagai ORM untuk database.

const process = require('process');
// Mengimpor modul process untuk mengakses variabel lingkungan (environment variable).

const basename = path.basename(__filename);
// Mendapatkan nama file ini sendiri (biasanya 'index.js').

const env = process.env.NODE_ENV || 'development';
// Menentukan environment yang sedang digunakan (default: 'development').

const config = require(__dirname + '/../config/config.json')[env];
// Mengambil konfigurasi database dari file config.json sesuai environment.

const db = {};
// Membuat objek kosong untuk menampung semua model yang akan di-load.

let sequelize;
if (config.use_env_variable) {
  // Jika config menggunakan environment variable untuk koneksi database:
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // Jika tidak, gunakan konfigurasi manual dari config.json:
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Membaca semua file di direktori ini (models), kecuali file tersembunyi, file ini sendiri, file non-js, dan file test.
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&         // Bukan file tersembunyi (tidak diawali titik)
      file !== basename &&               // Bukan file index.js ini sendiri
      file.slice(-3) === '.js' &&        // Hanya file .js
      file.indexOf('.test.js') === -1    // Bukan file test
    );
  })
  .forEach(file => {
    // Untuk setiap file model, import dan inisialisasi modelnya, lalu simpan ke objek db
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Untuk setiap model yang memiliki method associate, panggil method tersebut untuk membuat relasi antar model
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Menyimpan instance sequelize dan konstruktor Sequelize ke objek db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
// Mengekspor objek db yang berisi semua model dan instance sequelize agar bisa digunakan di seluruh aplikasi.
