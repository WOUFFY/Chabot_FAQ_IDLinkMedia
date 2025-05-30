const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yaml = require('js-yaml');

/**
 * Trains a Rasa model using the API with data from database
 * @param {Object} trainingData - Training data from database
 * @param {Object} trainingData.config - Configuration settings
 * @param {Array} trainingData.intents - Intent data with examples
 * @param {Array} trainingData.domainIntents - Domain intents list
 * @param {Object} trainingData.responses - Response templates
 * @param {Array} trainingData.actions - Actions list
 * @param {Object} trainingData.slots - Slot configurations
 * @param {Array} trainingData.stories - Stories with steps
 * @param {Array} trainingData.rules - Rules with steps
 * @param {Object} trainingData.sessionConfig - Session configuration
 * @returns {Promise<string>} The name of the trained model file
 */
const trainRasaModel = async (trainingData = null) => {
    try {
        console.log('Starting Rasa model training');

        let configData, domainData, nluData, storiesData, rulesData;

        if (trainingData) {
            console.log('Using provided training data from database');

            // Generate config data from database configuration
            if (trainingData.config) {
                configData = generateConfigYaml(trainingData.config);
                console.log(`Using configuration from database: language=${trainingData.config.language}, recipe=${trainingData.config.recipe}`);
            } else {
                // Read config from file as fallback
                const configPath = path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/config.yml');
                if (!fs.existsSync(configPath)) {
                    throw new Error(`Config file not found at ${configPath}`);
                }
                configData = fs.readFileSync(configPath, 'utf-8');
                console.log('Using configuration from file');
            }

            // Generate domain data from props
            domainData = generateDomainYaml(
                trainingData.domainIntents || trainingData.intents.map(i => i.name),
                trainingData.responses,
                trainingData.actions,
                trainingData.slots,
                trainingData.sessionConfig
            );

            // Generate NLU data from props
            nluData = generateNluYaml(trainingData.intents);

            // Generate stories data from props
            storiesData = generateStoriesYaml(trainingData.stories);

            // Generate rules data from props
            rulesData = generateRulesYaml(trainingData.rules);
        } else {
            console.log('No training data provided, using files from disk');

            // Define paths to YAML configuration files
            const configPath = path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/config.yml');
            const domainPath = path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/domain.yml');
            const nluPath = path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/data/nlu.yml');
            const storiesPath = path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/data/stories.yml');
            const rulesPath = path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/data/rules.yml');

            // Check if all required files exist
            const requiredFiles = [
                { path: configPath, name: 'config.yml' },
                { path: domainPath, name: 'domain.yml' },
                { path: nluPath, name: 'nlu.yml' },
                { path: storiesPath, name: 'stories.yml' },
                { path: rulesPath, name: 'rules.yml' }
            ];

            for (const file of requiredFiles) {
                if (!fs.existsSync(file.path)) {
                    throw new Error(`Required file ${file.name} not found at ${file.path}`);
                }
            }

            // Read all YAML files
            configData = fs.readFileSync(configPath, 'utf-8');
            domainData = fs.readFileSync(domainPath, 'utf-8');
            nluData = fs.readFileSync(nluPath, 'utf-8');
            storiesData = fs.readFileSync(storiesPath, 'utf-8');
            rulesData = fs.readFileSync(rulesPath, 'utf-8');
        }

        console.log('All training data prepared successfully');

        // Ensure models directory exists
        const modelsDir = path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/models');
        if (!fs.existsSync(modelsDir)) {
            fs.mkdirSync(modelsDir, { recursive: true });
            console.log(`Created models directory at ${modelsDir}`);
        }

        // Send training request to Rasa API
        console.log('Sending training request to Rasa API');
        const response = await axios.post('http://localhost:5005/model/train', {
            config: configData,
            domain: domainData,
            nlu: nluData,
            stories: storiesData,
            rules: rulesData,
            force: true,
            save_to_default_model_directory: false
        }, {
            responseType: 'arraybuffer',
            timeout: 300000 // 5 minute timeout for training
        });

        // Generate a unique model name with timestamp and save the trained model
        const modelName = `model_${Date.now()}.tar.gz`;
        const modelPath = path.join(modelsDir, modelName);

        fs.writeFileSync(modelPath, response.data);
        console.log(`Model trained successfully and saved as ${modelName}`);

        // Update the latest model symlink/reference
        try {
            const latestModelPath = path.join(modelsDir, 'latest.tar.gz');
            if (fs.existsSync(latestModelPath)) {
                fs.unlinkSync(latestModelPath);
            }
            fs.copyFileSync(modelPath, latestModelPath);
            console.log('Updated latest.tar.gz reference');
        } catch (err) {
            console.warn(`Failed to update latest model reference: ${err.message}`);
            // Continue since this is not a critical error
        }

        return modelName;
    } catch (error) {
        // Enhanced error handling
        const errorMessage = error.response
            ? `Rasa training failed with status ${error.response.status}: ${error.response.statusText}`
            : `Rasa training failed: ${error.message}`;

        console.error(errorMessage);

        // If we have a binary response with error details
        if (error.response && error.response.data) {
            try {
                // Try to decode the binary response as UTF-8 text
                const errorDetails = Buffer.from(error.response.data).toString('utf-8');
                console.error(`Error details: ${errorDetails}`);
            } catch (e) {
                console.error('Could not decode error details from Rasa');
            }
        }

        throw new Error(errorMessage);
    }
};

/**
 * Generate config YAML content from configuration data
 */
function generateConfigYaml(configData) {
    const configObj = {
        recipe: configData.recipe || 'default.v1',
        language: configData.language || 'id',
        pipeline: configData.pipeline || [],
        policies: configData.policies || []
    };

    if (configData.assistant_id) {
        configObj.assistant_id = configData.assistant_id;
    }

    return yaml.dump(configObj);
}

/**
 * Generate domain YAML content from training data
 */
function generateDomainYaml(intents, responses, actions, slots, sessionConfig) {
    const domainObj = {
        version: '3.1',
        intents: intents || [],
        responses: responses ? responses.reduce((acc, r) => {
            acc[r.name] = r.templates;
            return acc;
        }, {}) : {},
        actions: actions || [],
        slots: slots || {}
    };

    // Add session configuration if provided
    if (sessionConfig) {
        domainObj.session_config = {
            session_expiration_time: sessionConfig.session_expiration_time || 60,
            carry_over_slots_to_new_session:
                sessionConfig.carry_over_slots_to_new_session !== undefined ?
                    sessionConfig.carry_over_slots_to_new_session : true
        };
    }

    return `version: "3.1"
intents:
${intents.map(intent => `  - ${intent}`).join('\n')}

responses:
${Object.entries(domainObj.responses).map(([name, templates]) => `  ${name}:
${templates.map(template => {
        let result = '    - ';
        if (template.text) {
            result += `text: "${template.text}"`;
        }
        if (template.buttons) {
            result += `\n      buttons:`;
            template.buttons.forEach(button => {
                result += `\n        - title: "${button.title}"`;
                result += `\n          payload: "${button.payload}"`;
            });
        }
        if (template.image) {
            result += `\n      image: "${template.image}"`;
        }
        return result;
    }).join('\n')}
`).join('\n')}

${actions.length > 0 ? `actions:
${actions.map(action => `  - ${action}`).join('\n')}` : ''}

${Object.keys(slots).length > 0 ? `slots:
${Object.entries(slots).map(([name, config]) => {
        let result = `  ${name}:\n    type: ${config.type}`;
        if (config.influence_conversation !== undefined) {
            result += `\n    influence_conversation: ${config.influence_conversation}`;
        }
        if (config.initial_value !== undefined) {
            result += `\n    initial_value: ${config.initial_value}`;
        }
        if (config.auto_fill !== undefined) {
            result += `\n    auto_fill: ${config.auto_fill}`;
        }
        if (config.values) {
            result += `\n    values:`;
            config.values.forEach(value => {
                result += `\n      - ${value}`;
            });
        }
        return result;
    }).join('\n')}` : ''}

${sessionConfig ? `session_config:
  session_expiration_time: ${sessionConfig.session_expiration_time || 60}
  carry_over_slots_to_new_session: ${sessionConfig.carry_over_slots_to_new_session !== undefined ? sessionConfig.carry_over_slots_to_new_session : true}` : ''}
`;
}

/**
 * Generate NLU YAML content from training data
 */
function generateNluYaml(intents) {
    return `version: "3.1"
nlu:
${intents.map(intent => `- intent: ${intent.name}
  examples: |
    ${intent.examples.map(example => `- ${example}`).join('\n    ')}
`).join('\n')}
`;
}

/**
 * Generate stories YAML content from training data
 */
function generateStoriesYaml(stories) {
    return `version: "3.1"
stories:
${stories.map(story => `- story: ${story.name}
  steps:
${story.steps.sort((a, b) => a.order - b.order).map(step => `    - ${step.type}: ${step.name}`).join('\n')}
`).join('\n')}
`;
}

/**
 * Generate rules YAML content from training data
 */
function generateRulesYaml(rules) {
    return `version: "3.1"
rules:
${rules.map(rule => `- rule: ${rule.name}
  steps:
${rule.steps.sort((a, b) => a.order - b.order).map(step => `    - ${step.type}: ${step.name}`).join('\n')}
`).join('\n')}
`;
}

/**
 * Loads a trained model into the Rasa server
 * @param {string} modelName - Name of the model file to load
 * @returns {Promise<Object>} Response from the Rasa server
 */
const loadRasaModel = async (modelName) => {
    try {
        console.log(`Loading model ${modelName} into Rasa server`);

        const modelPath = path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/models', modelName);

        if (!fs.existsSync(modelPath)) {
            throw new Error(`Model file ${modelName} not found at ${modelPath}`);
        }

        const response = await axios.put('http://localhost:5005/model', {
            model_file: modelPath
        });

        console.log('Model loaded successfully');
        return response.data;
    } catch (error) {
        const errorMessage = error.response
            ? `Failed to load model: ${error.response.status} ${error.response.statusText}`
            : `Failed to load model: ${error.message}`;

        console.error(errorMessage);
        throw new Error(errorMessage);
    }
};

module.exports = {
    trainRasaModel,
    loadRasaModel
};