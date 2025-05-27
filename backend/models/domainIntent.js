'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class DomainIntent extends Model {
        static associate(models) {
            // associations can be defined here
        }
    }

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
        sequelize,
        modelName: 'DomainIntent'
    });

    return DomainIntent;
};