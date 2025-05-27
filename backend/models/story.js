'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Story extends Model {
        static associate(models) {
            // Define association with StoryStep
            Story.hasMany(models.StoryStep, {
                onDelete: 'CASCADE',
                hooks: true
            });
        }
    }

    Story.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        sequelize,
        modelName: 'Story'
    });

    return Story;
};