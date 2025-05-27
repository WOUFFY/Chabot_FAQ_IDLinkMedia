'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Rule extends Model {
        static associate(models) {
            // Define association with RuleStep
            Rule.hasMany(models.RuleStep, {
                onDelete: 'CASCADE',
                hooks: true
            });
        }
    }

    Rule.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        sequelize,
        modelName: 'Rule'
    });

    return Rule;
};