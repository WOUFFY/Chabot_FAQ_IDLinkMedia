'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StoryStep extends Model {
        static associate(models) {
            // Define association with Story
            StoryStep.belongsTo(models.Story);
        }
    }

    StoryStep.init({
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
        StoryId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Stories',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'StoryStep'
    });

    return StoryStep;
};