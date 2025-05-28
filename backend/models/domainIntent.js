// mengaktifkan kode strict mode untuk keseluruhan fail
'use strict';
// mengimport Model dari sequelize
// dan mengimport DataTypes dari sequelize untuk mendefinisikan tipe data
const { Model } = require('sequelize');

// mendefinisikan model DomainIntent
// yang akan digunakan untuk berinteraksi dengan tabel domain_intents
module.exports = (sequelize, DataTypes) => {
    // mendefinisikan kelas DomainIntent yang mewarisi dari Model
    // kelas ini akan merepresentasikan tabel domain_intents
    class DomainIntent extends Model {
        /**
         * Method untuk mendefinisikan asosiasi antar model
         * @param {Object} models - Objek yang berisi semua model yang didefinisikan
         */
        static associate(models) {
            // associations can be defined here
        }
    }
    // menginisialisasi model DomainIntent dengan atribut dan opsi
    // atribut name adalah string yang tidak boleh kosong dan unik
    DomainIntent.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true
            }
        }
    }, {
        // opsi untuk model ini
        sequelize,
        modelName: 'DomainIntent'
    });

    // mengembalikan model DomainIntent yang telah didefinisikan
    // model ini akan digunakan untuk berinteraksi dengan tabel domain_intents
    return DomainIntent;
};