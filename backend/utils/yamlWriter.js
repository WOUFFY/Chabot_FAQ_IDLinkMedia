const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Creates a directory if it doesn't exist
 * @param {string} dirPath - Path to the directory
 */
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        console.log(`Creating directory: ${dirPath}`);
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

/**
 * Writes YAML files for Rasa training
 * @param {Object} data - The data to write to YAML files
 * @returns {Object} - Paths of the written files
 */
const writeYAMLFiles = async ({
    intents,
    domainIntents = [],
    responses = [],
    actions = [],
    slots = {},
    stories = [],
    rules = [],
    sessionConfig = null
}) => {
    console.log('Starting to write YAML files...');

    // Define paths - use the existing data folder
    const dataDir = path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/data');
    const domainPath = path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/domain.yml');
    const nluPath = path.join(dataDir, 'nlu.yml');
    const storiesPath = path.join(dataDir, 'stories.yml');
    const rulesPath = path.join(dataDir, 'rules.yml');

    // Ensure data directory exists
    ensureDirectoryExists(dataDir);

    // Write domain.yml
    console.log('Writing domain.yml');
    const domainContent = {
        version: '3.1',
        intents: domainIntents.length > 0 ? domainIntents : intents.map(i => i.name),
        responses: responses.reduce((acc, r) => {
            acc[r.name] = r.templates;
            return acc;
        }, {})
    };

    // Generate YAML without session_config first
    let domainYAML = yaml.dump(domainContent, { lineWidth: -1, indent: 2 });

    // Tambahkan baris kosong antar blok utama agar tidak rapat
    domainYAML = domainYAML
        .replace(/^(version: .*)$/m, '$1\n')
        .replace(/^(intents:([\s\S]*?))(?=responses:)/m, '$1\n')
        .replace(/^(responses:([\s\S]*?))(?=actions:)/m, '$1\n')

    // Add session_config with proper spacing manually
    if (sessionConfig) {
        // Add extra line break before session_config
        domainYAML += '\nsession_config:\n';
        domainYAML += `  session_expiration_time: ${sessionConfig.session_expiration_time}\n`;
        domainYAML += `  carry_over_slots_to_new_session: ${sessionConfig.carry_over_slots_to_new_session}\n`;
    }

    // Tulis hasil YAML yang sudah diberi spasi ke file
    fs.writeFileSync(domainPath, domainYAML);

    // Write nlu.yml with the original format
    console.log('Writing nlu.yml');
    const nluYaml = `version: "3.1"\nnlu:\n${intents.map(intent => (
        `- intent: ${intent.name}\n  examples: |\n    ${intent.examples.map(e => `${e}`).join('\n    ')}`
    )).join('\n\n')}`;

    fs.writeFileSync(nluPath, nluYaml);

    // Write stories.yml with the original format
    console.log('Writing stories.yml');
    const storyYaml = `version: "3.1"\nstories:\n${stories.map(story => {
        const steps = story.steps
            .sort((a, b) => a.order - b.order)
            .map(step => `  - ${step.type}: ${step.name}`)
            .join('\n');
        return `- story: ${story.name}\n  steps:\n${steps}`;
    }).join('\n\n')}`;

    fs.writeFileSync(storiesPath, storyYaml);

    // Write rules.yml with the original format
    console.log('Writing rules.yml');
    const ruleYaml = `version: "3.1"\nrules:\n${rules.map(rule => {
        const steps = rule.steps
            .sort((a, b) => a.order - b.order)
            .map(step => `  - ${step.type}: ${step.name}`)
            .join('\n');
        return `- rule: ${rule.name}\n  steps:\n${steps}`;
    }).join('\n\n')}`;

    fs.writeFileSync(rulesPath, ruleYaml);

    console.log('YAML files written successfully');

    // Return the paths of created files
    return {
        domainPath,
        nluPath,
        storiesPath,
        rulesPath
    };
};

module.exports = { writeYAMLFiles };