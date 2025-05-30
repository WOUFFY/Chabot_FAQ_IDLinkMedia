// mengaktifkan kode strict mode untuk keseluruhan fail
'use strict';
// mengimport Model dari sequelize
// dan mengimport DataTypes dari sequelize untuk mendefinisikan tipe data
const { Model } = require('sequelize');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// mendefinisikan model Config
// yang akan digunakan untuk berinteraksi dengan tabel configs
module.exports = (sequelize, DataTypes) => {
    // mendefinisikan kelas Config yang mewarisi dari Model
    // kelas ini akan merepresentasikan tabel configs
    class Config extends Model {
        /**
         * Method untuk mendefinisikan asosiasi antar model
         * @param {Object} models - Objek yang berisi semua model yang didefinisikan
         */
        static associate(models) {
            // associations can be defined here
        }

        /**
         * Method untuk memuat konfigurasi dari file YAML
         * @param {string} filePath - Path ke file YAML
         * @returns {Promise<Config>} - Objek konfigurasi
         */
        static async loadFromYaml(filePath) {
            try {
                const configYamlPath = filePath || path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/config.yml');
                const fileContent = fs.readFileSync(configYamlPath, 'utf8');
                const configData = yaml.load(fileContent);

                // Create or update config in database
                const configName = 'default';
                const [config, created] = await Config.findOrCreate({
                    where: { name: configName },
                    defaults: {
                        recipe: configData.recipe || 'default.v1',
                        assistant_id: configData.assistant_id,
                        language: configData.language || 'id',
                        pipeline: configData.pipeline || [],
                        policies: configData.policies || [],
                        isActive: true
                    }
                });

                if (!created) {
                    await config.update({
                        recipe: configData.recipe || config.recipe,
                        assistant_id: configData.assistant_id || config.assistant_id,
                        language: configData.language || config.language,
                        pipeline: configData.pipeline || config.pipeline,
                        policies: configData.policies || config.policies,
                        isActive: true
                    });
                }

                return config;
            } catch (error) {
                console.error('Error loading config from YAML:', error);
                throw error;
            }
        }

        /**
         * Method untuk menyimpan konfigurasi ke file YAML
         * @param {string} filePath - Path ke file YAML
         * @returns {Promise<boolean>} - Status keberhasilan
         */
        async saveToYaml(filePath) {
            try {
                const configYamlPath = filePath || path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/config.yml');

                // Create config object
                const configData = {
                    recipe: this.recipe,
                    assistant_id: this.assistant_id,
                    language: this.language,
                    pipeline: this.pipeline,
                    policies: this.policies
                };

                // Format YAML with comments and sections
                const formattedYaml = `# The config recipe.
# https://rasa.com/docs/rasa/model-configuration/
recipe: ${this.recipe}

# The assistant project unique identifier
# This default value must be replaced with a unique assistant name within your deployment
assistant_id: ${this.assistant_id}

# Configuration for Rasa NLU.
# https://rasa.com/docs/rasa/nlu/components/
language: ${this.language}

pipeline:
${yaml.dump(this.pipeline, { lineWidth: -1, indent: 2 })}

# Configuration for Rasa Core.
# https://rasa.com/docs/rasa/core/policies/
policies:
${yaml.dump(this.policies, { lineWidth: -1, indent: 2 })}
`;

                // Write to file
                fs.writeFileSync(configYamlPath, formattedYaml);
                return true;
            } catch (error) {
                console.error('Error saving config to YAML:', error);
                throw error;
            }
        }

        /**
         * Method untuk mendapatkan konfigurasi aktif
         * @returns {Promise<Config>} - Objek konfigurasi aktif
         */
        static async getActiveConfig() {
            try {
                const config = await Config.findOne({
                    where: { isActive: true }
                });

                if (!config) {
                    return await Config.loadFromYaml();
                }

                return config;
            } catch (error) {
                console.error('Error getting active config:', error);
                throw error;
            }
        }
    }

    // menginisialisasi model Config dengan atribut dan opsi
    Config.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true
            }
        },
        recipe: {
            type: DataTypes.STRING,
            defaultValue: 'default.v1'
        },
        assistant_id: {
            type: DataTypes.STRING
        },
        language: {
            type: DataTypes.STRING,
            defaultValue: 'id'
        },
        pipeline: {
            type: DataTypes.TEXT,
            get() {
                const rawValue = this.getDataValue('pipeline');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            set(value) {
                this.setDataValue('pipeline', JSON.stringify(value));
            }
        },
        policies: {
            type: DataTypes.TEXT,
            get() {
                const rawValue = this.getDataValue('policies');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            set(value) {
                this.setDataValue('policies', JSON.stringify(value));
            }
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        // opsi untuk model ini
        sequelize,
        modelName: 'Config'
    });

    // mengembalikan model Config yang telah didefinisikan
    // model ini akan digunakan untuk berinteraksi dengan tabel configs
    return Config;
};