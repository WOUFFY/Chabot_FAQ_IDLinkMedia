// untuk menulis script yang mengimpor data dari Rasa ke database menggunakan Sequelize

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { Sequelize } = require('sequelize');
const db = require('../models');

const {
    Intent,
    IntentExample,
    Story,
    StoryStep,
    Rule,
    RuleStep,
    DomainIntent,
    DomainResponse,
    ResponseTemplate,
    SessionConfig
} = db;

// Path to Rasa data files - adjust these paths as needed
const RASA_PROJECT_PATH = path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia');
const NLU_PATH = path.join(RASA_PROJECT_PATH, 'data/nlu.yml');
const STORIES_PATH = path.join(RASA_PROJECT_PATH, 'data/stories.yml');
const RULES_PATH = path.join(RASA_PROJECT_PATH, 'data/rules.yml');
const DOMAIN_PATH = path.join(RASA_PROJECT_PATH, 'domain.yml');

/**
 * Import NLU data (intents and examples)
 */
async function importNluData() {
    try {
        console.log('Importing NLU data...');

        if (!fs.existsSync(NLU_PATH)) {
            console.error(`NLU file not found at: ${NLU_PATH}`);
            return;
        }

        const nluContent = fs.readFileSync(NLU_PATH, 'utf8');
        const nluData = yaml.load(nluContent);

        if (!nluData.nlu) {
            console.error('No NLU data found in file');
            return;
        }

        // Process each intent and its examples
        for (const item of nluData.nlu) {
            if (item.intent) {
                const intentName = item.intent;
                console.log(`Processing intent: ${intentName}`);

                // Create intent in database
                const [intent, created] = await Intent.findOrCreate({
                    where: { name: intentName }
                });

                // Extract examples
                if (item.examples) {
                    // Remove leading/trailing pipe character and split by newlines
                    const examplesText = item.examples.trim().replace(/^\|/, '').trim();
                    const examples = examplesText
                        .split('\n')
                        .map(example => example.trim())
                        .filter(example => example.length > 0);

                    // Create examples in database
                    for (const exampleText of examples) {
                        await IntentExample.findOrCreate({
                            where: {
                                text: exampleText,
                                IntentId: intent.id
                            }
                        });
                    }
                    console.log(`Added ${examples.length} examples for intent: ${intentName}`);
                }
            }
        }

        console.log('NLU data import completed successfully');
    } catch (error) {
        console.error('Error importing NLU data:', error);
        throw error;
    }
}

/**
 * Import Stories data
 */
async function importStoriesData() {
    try {
        console.log('Importing Stories data...');

        if (!fs.existsSync(STORIES_PATH)) {
            console.error(`Stories file not found at: ${STORIES_PATH}`);
            return;
        }

        const storiesContent = fs.readFileSync(STORIES_PATH, 'utf8');
        const storiesData = yaml.load(storiesContent);

        if (!storiesData.stories) {
            console.error('No stories found in file');
            return;
        }

        console.log(`Found ${storiesData.stories.length} stories`);

        // Process each story
        for (const story of storiesData.stories) {
            if (story.story) {
                const storyName = story.story;
                console.log(`Processing story: ${storyName}`);

                // Create story in database
                const [storyRecord, created] = await Story.findOrCreate({
                    where: { name: storyName }
                });

                // Process steps
                if (story.steps && Array.isArray(story.steps)) {
                    let stepOrder = 0;

                    for (const step of story.steps) {
                        try {
                            // Handle intent steps
                            if (step.intent) {
                                await StoryStep.create({
                                    type: 'intent',
                                    name: step.intent,
                                    StoryId: storyRecord.id,
                                    order: stepOrder++
                                });
                                console.log(`  Added intent step: ${step.intent}`);
                            }

                            // Handle action steps
                            if (step.action) {
                                await StoryStep.create({
                                    type: 'action',
                                    name: step.action,
                                    StoryId: storyRecord.id,
                                    order: stepOrder++
                                });
                                console.log(`  Added action step: ${step.action}`);
                            }
                        } catch (stepError) {
                            console.error(`Error adding step for story ${storyName}:`, stepError);
                        }
                    }

                    console.log(`Added ${stepOrder} steps for story: ${storyName}`);
                }
            }
        }

        console.log('Stories data import completed successfully');
    } catch (error) {
        console.error('Error importing Stories data:', error);
        throw error;
    }
}

/**
 * Import Rules data
 */
async function importRulesData() {
    try {
        console.log('Importing Rules data...');

        if (!fs.existsSync(RULES_PATH)) {
            console.error(`Rules file not found at: ${RULES_PATH}`);
            return;
        }

        const rulesContent = fs.readFileSync(RULES_PATH, 'utf8');
        const rulesData = yaml.load(rulesContent);

        if (!rulesData.rules) {
            console.error('No rules found in file');
            return;
        }

        console.log(`Found ${rulesData.rules.length} rules`);

        // Process each rule
        for (const rule of rulesData.rules) {
            if (rule.rule) {
                const ruleName = rule.rule;
                console.log(`Processing rule: ${ruleName}`);

                // Create rule in database
                const [ruleRecord, created] = await Rule.findOrCreate({
                    where: { name: ruleName }
                });

                // Process steps
                if (rule.steps && Array.isArray(rule.steps)) {
                    let stepOrder = 0;

                    for (const step of rule.steps) {
                        try {
                            // Handle intent steps
                            if (step.intent) {
                                await RuleStep.create({
                                    type: 'intent',
                                    name: step.intent,
                                    RuleId: ruleRecord.id,
                                    order: stepOrder++
                                });
                                console.log(`  Added intent step: ${step.intent}`);
                            }

                            // Handle action steps
                            if (step.action) {
                                await RuleStep.create({
                                    type: 'action',
                                    name: step.action,
                                    RuleId: ruleRecord.id,
                                    order: stepOrder++
                                });
                                console.log(`  Added action step: ${step.action}`);
                            }
                        } catch (stepError) {
                            console.error(`Error adding step for rule ${ruleName}:`, stepError);
                        }
                    }

                    console.log(`Added ${stepOrder} steps for rule: ${ruleName}`);
                }
            }
        }

        console.log('Rules data import completed successfully');
    } catch (error) {
        console.error('Error importing Rules data:', error);
        throw error;
    }
}

/**
 * Import Domain data
 */
async function importDomainData() {
    try {
        console.log('Importing Domain data...');

        if (!fs.existsSync(DOMAIN_PATH)) {
            console.error(`Domain file not found at: ${DOMAIN_PATH}`);
            return;
        }

        const domainContent = fs.readFileSync(DOMAIN_PATH, 'utf8');
        const domainData = yaml.load(domainContent);

        // Import intents
        if (domainData.intents && Array.isArray(domainData.intents)) {
            console.log(`Found ${domainData.intents.length} intents in domain`);

            for (const intent of domainData.intents) {
                const intentName = typeof intent === 'string' ? intent : intent.intent || '';
                if (intentName) {
                    await DomainIntent.findOrCreate({
                        where: { name: intentName }
                    });
                    console.log(`Added domain intent: ${intentName}`);
                }
            }
        }

        // Import responses
        if (domainData.responses && typeof domainData.responses === 'object') {
            const responseCount = Object.keys(domainData.responses).length;
            console.log(`Found ${responseCount} responses in domain`);

            for (const [responseName, templates] of Object.entries(domainData.responses)) {
                console.log(`Processing response: ${responseName}`);

                // Create response in database
                const [response, created] = await DomainResponse.findOrCreate({
                    where: { name: responseName }
                });

                if (Array.isArray(templates)) {
                    // Process each template for this response
                    for (const template of templates) {
                        // Extract known properties
                        const { text, buttons, image, ...customProps } = template;

                        await ResponseTemplate.create({
                            text: text || null,
                            buttons: buttons || null,
                            image: image || null,
                            custom: Object.keys(customProps).length > 0 ? customProps : null,
                            DomainResponseId: response.id
                        });
                    }

                    console.log(`  Added ${templates.length} templates for response: ${responseName}`);
                }
            }
        }

        // Import session config
        if (domainData.session_config) {
            console.log('Processing session configuration');

            await SessionConfig.findOrCreate({
                where: { id: 1 },
                defaults: {
                    session_expiration_time: domainData.session_config.session_expiration_time || 60,
                    carry_over_slots_to_new_session:
                        domainData.session_config.carry_over_slots_to_new_session !== undefined
                            ? domainData.session_config.carry_over_slots_to_new_session
                            : true
                }
            });

            console.log('Session configuration imported');
        }

        console.log('Domain data import completed successfully');
    } catch (error) {
        console.error('Error importing Domain data:', error);
        throw error;
    }
}

/**
 * Main import function to synchronize all data
 */
async function importAllData() {
    try {
        console.log('Starting data import process...');
        console.log('NLU path:', NLU_PATH);
        console.log('Stories path:', STORIES_PATH);
        console.log('Rules path:', RULES_PATH);
        console.log('Domain path:', DOMAIN_PATH);

        // Import data in sequence
        await importNluData();
        await importStoriesData();
        await importRulesData();
        await importDomainData();

        console.log('All data imported successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error during data import:', error);
        process.exit(1);
    }
}

// Run the import
importAllData();