'use strict';
// Mengaktifkan strict mode untuk keamanan dan best practice JavaScript

const { Model } = require('sequelize');
// Mengimpor class Model dari Sequelize untuk membuat model database

module.exports = (sequelize, DataTypes) => {
    // Mengekspor fungsi yang menerima instance sequelize dan DataTypes

    class Intent extends Model {
        // Mendefinisikan class Intent yang mewarisi dari Sequelize Model

        static associate(models) {
            // Method statis untuk mendefinisikan relasi antar model

            Intent.hasMany(models.IntentExample, {
                // Mendefinisikan relasi one-to-many: satu Intent memiliki banyak IntentExample
                onDelete: 'CASCADE',
                // Jika Intent dihapus, semua IntentExample yang terkait juga dihapus (cascade)
                hooks: true
                // Mengaktifkan hooks agar penghapusan cascade berjalan dengan benar
            });
        }
    }

    Intent.init({
        // Inisialisasi model Intent beserta field/kolomnya
        name: {
            type: DataTypes.STRING,
            // Field 'name' bertipe string
            allowNull: false,
            // Tidak boleh null
            unique: true
            // Harus unik di tabel
        }
    }, {
        sequelize,
        // Instance sequelize yang digunakan
        modelName: 'Intent'
        // Nama model yang terdaftar di Sequelize
    });

    return Intent;
    // Mengembalikan model Intent agar bisa digunakan di tempat lain
};