'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class DomainResponse extends Model {
        static associate(models) {
            DomainResponse.hasMany(models.ResponseTemplate, {
                onDelete: 'CASCADE',
                hooks: true
            });
        }
    }

    DomainResponse.init({
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
        modelName: 'DomainResponse'
    });

    return DomainResponse;
};