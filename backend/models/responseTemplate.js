'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ResponseTemplate extends Model {
        static associate(models) {
            ResponseTemplate.belongsTo(models.DomainResponse);
        }
    }

    ResponseTemplate.init({
        text: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        buttons: {
            type: DataTypes.JSON,
            allowNull: true
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true
        },
        custom: {
            type: DataTypes.JSON,
            allowNull: true
        },
        DomainResponseId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'DomainResponses',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'ResponseTemplate'
    });

    return ResponseTemplate;
};