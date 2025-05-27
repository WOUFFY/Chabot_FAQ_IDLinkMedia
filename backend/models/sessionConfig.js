'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class SessionConfig extends Model {
        static associate(models) {
            // No associations needed
        }
    }

    SessionConfig.init({
        session_expiration_time: {
            type: DataTypes.INTEGER,
            defaultValue: 60
        },
        carry_over_slots_to_new_session: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'SessionConfig'
    });

    return SessionConfig;
};