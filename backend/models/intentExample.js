'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class IntentExample extends Model {
        static associate(models) {
            // Define association with Intent
            IntentExample.belongsTo(models.Intent);
        }
    }

    IntentExample.init({
        text: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        IntentId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Intents',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'IntentExample'
    });

    return IntentExample;
};