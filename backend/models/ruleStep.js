'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class RuleStep extends Model {
        static associate(models) {
            // Define association with Rule
            RuleStep.belongsTo(models.Rule);
        }
    }

    RuleStep.init({
        type: {
            type: DataTypes.ENUM('intent', 'action'),
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        RuleId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Rules',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'RuleStep'
    });

    return RuleStep;
};