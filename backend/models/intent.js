'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Intent extends Model {
        static associate(models) {
            // Define association with IntentExample
            Intent.hasMany(models.IntentExample, {
                onDelete: 'CASCADE',
                hooks: true
            });
        }
    }

    Intent.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        sequelize,
        modelName: 'Intent'
    });

    return Intent;
};