const express = require('express');
const router = express.Router();
const { writeYAMLFiles } = require('../utils/yamlWriter');
const { trainRasaModel } = require('../services/rasaTrainer');
const db = require('../models');

// Enhanced function to safely access models with error handling
const getModelSafely = (modelName) => {
    const model = db[modelName];
    if (!model) {
        console.warn(`Model ${modelName} not found in db object.`);
        return null;
    }
    return model;
};

// Function to gather data safely whether the model exists or not
const safelyGetData = async (modelName, includeModel = null, includeOptions = {}) => {
    try {
        const model = getModelSafely(modelName);
        if (!model) {
            console.log(`Skipping data fetch for non-existent model: ${modelName}`);
            return [];
        }

        const options = includeModel ? { include: [{ model: includeModel, ...includeOptions }] } : {};
        return await model.findAll(options);
    } catch (err) {
        console.error(`Error fetching data from ${modelName}:`, err);
        return [];
    }
};

/**
 * @swagger
 * /api/train:
 *   post:
 *     summary: Train a new Rasa model
 *     description: Loads data from DB, generates YAML files, triggers Rasa training, and saves the model
 *     tags: [Training]
 *     responses:
 *       200:
 *         description: Training completed successfully
 *       500:
 *         description: Training failed
 */
router.post('/train', async (req, res) => {
    try {
        console.log('Starting training data collection from database...');

        // Get all models - safely handling missing models
        const Intent = getModelSafely('Intent');
        const IntentExample = getModelSafely('IntentExample');
        const DomainIntent = getModelSafely('DomainIntent');
        const DomainResponse = getModelSafely('DomainResponse');
        const ResponseTemplate = getModelSafely('ResponseTemplate');
        const DomainAction = getModelSafely('DomainAction');
        const DomainSlot = getModelSafely('DomainSlot');
        const Story = getModelSafely('Story');
        const StoryStep = getModelSafely('StoryStep');
        const Rule = getModelSafely('Rule');
        const RuleStep = getModelSafely('RuleStep');

        // Load data, safely handling missing models
        const intents = Intent ? await safelyGetData('Intent', IntentExample) : [];
        const domainIntents = DomainIntent ? await safelyGetData('DomainIntent') : [];
        const domainResponses = DomainResponse ?
            await safelyGetData('DomainResponse', ResponseTemplate, { as: 'ResponseTemplates' }) : [];
        const domainActions = DomainAction ? await safelyGetData('DomainAction') : [];
        const domainSlots = DomainSlot ? await safelyGetData('DomainSlot') : [];
        const stories = Story ? await safelyGetData('Story', StoryStep) : [];
        const rules = Rule ? await safelyGetData('Rule', RuleStep) : [];

        console.log(`Fetched data: ${intents.length} intents, ${domainResponses.length} responses, ${stories.length} stories, ${rules.length} rules`);

        // Transform database objects into the structure needed for YAML generation
        const transformedIntents = intents.map(i => ({
            name: i.name,
            examples: (i.IntentExamples || []).map(e => e.text)
        }));

        const transformedDomainIntents = domainIntents.map(i => i.name);

        const transformedResponses = domainResponses.map(r => ({
            name: r.name,
            templates: (r.ResponseTemplates || []).map(t => {
                const template = {};
                if (t.text) template.text = t.text;
                if (t.buttons) {
                    try {
                        template.buttons = JSON.parse(t.buttons);
                    } catch (e) {
                        console.warn(`Invalid buttons JSON for response ${r.name}:`, e.message);
                        template.buttons = [];
                    }
                }
                if (t.image) template.image = t.image;
                return template;
            })
        }));

        const transformedActions = domainActions ? domainActions.map(a => a.name) : [];

        const transformedSlots = domainSlots.reduce((acc, slot) => {
            acc[slot.name] = {
                type: slot.type,
                ...(slot.influence_conversation ? { influence_conversation: slot.influence_conversation } : {}),
                ...(slot.initial_value ? { initial_value: slot.initial_value } : {}),
                ...(slot.auto_fill ? { auto_fill: slot.auto_fill } : {}),
                ...(slot.values ? {
                    values: (() => {
                        try {
                            return JSON.parse(slot.values);
                        } catch (e) {
                            console.warn(`Invalid values JSON for slot ${slot.name}:`, e.message);
                            return [];
                        }
                    })()
                } : {})
            };
            return acc;
        }, {});

        const transformedStories = stories.map(s => ({
            name: s.name,
            steps: (s.StorySteps || []).map(step => ({
                type: step.type,
                name: step.name,
                order: step.order
            })).sort((a, b) => a.order - b.order) // Ensure steps are in correct order
        }));

        const transformedRules = rules.map(r => ({
            name: r.name,
            steps: (r.RuleSteps || []).map(step => ({
                type: step.type,
                name: step.name,
                order: step.order
            })).sort((a, b) => a.order - b.order) // Ensure steps are in correct order
        }));

        // Generate YAML files from transformed data
        const trainingData = {
            intents: transformedIntents,
            domainIntents: transformedDomainIntents,
            responses: transformedResponses,
            actions: transformedActions,
            slots: transformedSlots,
            stories: transformedStories,
            rules: transformedRules
        };

        // Optionally write YAML files for reference
        if (req.query.writeFiles === 'true') {
            await writeYAMLFiles(trainingData);
        }

        // Pass training data directly to the trainer
        const modelName = await trainRasaModel(trainingData);

        // Load the model into Rasa server
        console.log(`Loading model ${modelName} into Rasa server...`);
        const loadResult = await loadRasaModel(modelName);

        // Return success response
        res.status(200).json({
            message: 'Training complete and model loaded successfully',
            model: modelName,
            loadResult,
            stats: {
                intents: intents.length,
                domainIntents: domainIntents.length,
                responses: domainResponses.length,
                actions: transformedActions.length,
                slots: Object.keys(transformedSlots).length,
                stories: stories.length,
                rules: rules.length
            }
        });
    } catch (err) {
        console.error('Training error:', err);
        res.status(500).json({
            error: 'Training failed',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

/**
 * @swagger
 * /api/generate-yaml:
 *   post:
 *     summary: Generate YAML files from database without training
 *     description: Creates YAML files from database records without triggering training
 *     tags: [Training]
 *     responses:
 *       200:
 *         description: YAML files generated successfully
 *       500:
 *         description: YAML generation failed
 */
router.post('/generate-yaml', async (req, res) => {
    try {
        console.log('Starting YAML generation from database...');

        // Get all models - safely handling missing models
        const Intent = getModelSafely('Intent');
        const IntentExample = getModelSafely('IntentExample');
        const DomainIntent = getModelSafely('DomainIntent');
        const DomainResponse = getModelSafely('DomainResponse');
        const ResponseTemplate = getModelSafely('ResponseTemplate');
        const DomainAction = getModelSafely('DomainAction');
        const DomainSlot = getModelSafely('DomainSlot');
        const Story = getModelSafely('Story');
        const StoryStep = getModelSafely('StoryStep');
        const Rule = getModelSafely('Rule');
        const RuleStep = getModelSafely('RuleStep');

        // Load data, safely handling missing models
        const intents = Intent ? await safelyGetData('Intent', IntentExample) : [];
        const domainIntents = DomainIntent ? await safelyGetData('DomainIntent') : [];
        const domainResponses = DomainResponse ?
            await safelyGetData('DomainResponse', ResponseTemplate, { as: 'ResponseTemplates' }) : [];
        const domainActions = DomainAction ? await safelyGetData('DomainAction') : [];
        const domainSlots = DomainSlot ? await safelyGetData('DomainSlot') : [];
        const stories = Story ? await safelyGetData('Story', StoryStep) : [];
        const rules = Rule ? await safelyGetData('Rule', RuleStep) : [];

        console.log(`Fetched data: ${intents.length} intents, ${domainResponses.length} responses, ${stories.length} stories, ${rules.length} rules`);

        // Transform database objects into the structure needed for YAML generation
        const transformedIntents = intents.map(i => ({
            name: i.name,
            examples: (i.IntentExamples || []).map(e => e.text)
        }));

        const transformedDomainIntents = domainIntents.map(i => i.name);

        const transformedResponses = domainResponses.map(r => ({
            name: r.name,
            templates: (r.ResponseTemplates || []).map(t => {
                const template = {};
                if (t.text) template.text = t.text;
                if (t.buttons) {
                    try {
                        template.buttons = JSON.parse(t.buttons);
                    } catch (e) {
                        console.warn(`Invalid buttons JSON for response ${r.name}:`, e.message);
                        template.buttons = [];
                    }
                }
                if (t.image) template.image = t.image;
                return template;
            })
        }));

        const transformedActions = domainActions ? domainActions.map(a => a.name) : [];

        const transformedSlots = domainSlots.reduce((acc, slot) => {
            acc[slot.name] = {
                type: slot.type,
                ...(slot.influence_conversation ? { influence_conversation: slot.influence_conversation } : {}),
                ...(slot.initial_value ? { initial_value: slot.initial_value } : {}),
                ...(slot.auto_fill ? { auto_fill: slot.auto_fill } : {}),
                ...(slot.values ? {
                    values: (() => {
                        try {
                            return JSON.parse(slot.values);
                        } catch (e) {
                            console.warn(`Invalid values JSON for slot ${slot.name}:`, e.message);
                            return [];
                        }
                    })()
                } : {})
            };
            return acc;
        }, {});

        const transformedStories = stories.map(s => ({
            name: s.name,
            steps: (s.StorySteps || []).map(step => ({
                type: step.type,
                name: step.name,
                order: step.order
            })).sort((a, b) => a.order - b.order) // Ensure steps are in correct order
        }));

        const transformedRules = rules.map(r => ({
            name: r.name,
            steps: (r.RuleSteps || []).map(step => ({
                type: step.type,
                name: step.name,
                order: step.order
            })).sort((a, b) => a.order - b.order) // Ensure steps are in correct order
        }));

        // Generate YAML files from transformed data
        const yamlFiles = await writeYAMLFiles({
            intents: transformedIntents,
            domainIntents: transformedDomainIntents,
            responses: transformedResponses,
            actions: transformedActions,
            slots: transformedSlots,
            stories: transformedStories,
            rules: transformedRules
        });

        // Return success with stats
        res.status(200).json({
            message: 'YAML files generated successfully',
            files: yamlFiles,
            stats: {
                intents: intents.length,
                domainIntents: domainIntents.length,
                responses: domainResponses.length,
                actions: transformedActions.length,
                slots: Object.keys(transformedSlots).length,
                stories: stories.length,
                rules: rules.length
            }
        });
    } catch (err) {
        console.error('YAML generation error:', err);
        res.status(500).json({
            error: 'YAML generation failed',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

/**
 * @swagger
 * /api/extract-from-yaml:
 *   post:
 *     summary: Extract configuration from existing YAML files
 *     description: Reads existing domain.yml and populates the database with its contents
 *     tags: [Training]
 *     responses:
 *       200:
 *         description: Data extracted successfully
 *       500:
 *         description: Extraction failed
 */
router.post('/extract-from-yaml', async (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const yaml = require('js-yaml');

    try {
        console.log('Starting extraction from YAML files...');

        const domainPath = path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/domain.yml');
        const nluPath = path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/data/nlu.yml');

        if (!fs.existsSync(domainPath)) {
            throw new Error(`Domain file not found at ${domainPath}`);
        }

        // Load domain.yml file
        const domainContent = yaml.load(fs.readFileSync(domainPath, 'utf8'));
        console.log('Domain file loaded successfully');

        // Get models safely
        const DomainIntent = getModelSafely('DomainIntent');
        const DomainResponse = getModelSafely('DomainResponse');
        const ResponseTemplate = getModelSafely('ResponseTemplate');
        const Intent = getModelSafely('Intent');
        const IntentExample = getModelSafely('IntentExample');

        let stats = {
            intentsCreated: 0,
            examplesCreated: 0,
            domainIntentsCreated: 0,
            responsesCreated: 0,
            templatesCreated: 0
        };

        // Process intents
        if (domainContent.intents && DomainIntent) {
            for (const intentName of domainContent.intents) {
                // Skip if it's an object with extra properties like use_entities
                if (typeof intentName !== 'string') continue;

                try {
                    await DomainIntent.create({ name: intentName });
                    stats.domainIntentsCreated++;

                    // Also create in regular intents table if it exists
                    if (Intent) {
                        await Intent.create({
                            name: intentName,
                            hasDomainMapping: true
                        });
                        stats.intentsCreated++;
                    }
                } catch (error) {
                    console.warn(`Could not create intent ${intentName}: ${error.message}`);
                }
            }
        }

        // Process responses
        if (domainContent.responses && DomainResponse && ResponseTemplate) {
            for (const [responseName, templates] of Object.entries(domainContent.responses)) {
                try {
                    const response = await DomainResponse.create({ name: responseName });
                    stats.responsesCreated++;

                    // Create templates for this response
                    for (const template of templates) {
                        try {
                            const templateData = {
                                text: template.text || null,
                                DomainResponseId: response.id
                            };

                            if (template.buttons) {
                                templateData.buttons = JSON.stringify(template.buttons);
                            }

                            if (template.image) {
                                templateData.image = template.image;
                            }

                            await ResponseTemplate.create(templateData);
                            stats.templatesCreated++;
                        } catch (templateError) {
                            console.warn(`Could not create template for ${responseName}: ${templateError.message}`);
                        }
                    }
                } catch (error) {
                    console.warn(`Could not create response ${responseName}: ${error.message}`);
                }
            }
        }

        // Process NLU examples if the file exists
        if (fs.existsSync(nluPath) && Intent && IntentExample) {
            const nluContent = yaml.load(fs.readFileSync(nluPath, 'utf8'));

            if (nluContent.nlu) {
                for (const intentData of nluContent.nlu) {
                    const intentName = intentData.intent;

                    // Find or create the intent
                    let intent;
                    try {
                        [intent] = await Intent.findOrCreate({
                            where: { name: intentName },
                            defaults: { hasDomainMapping: true }
                        });
                    } catch (error) {
                        console.warn(`Could not process intent ${intentName}: ${error.message}`);
                        continue;
                    }

                    // Add examples
                    if (intentData.examples) {
                        const examples = intentData.examples
                            .replace(/^-\s*/gm, '') // Remove leading dash and space
                            .split('\n')
                            .filter(ex => ex.trim());

                        for (const example of examples) {
                            try {
                                await IntentExample.create({
                                    text: example.trim(),
                                    IntentId: intent.id
                                });
                                stats.examplesCreated++;
                            } catch (error) {
                                console.warn(`Could not create example "${example}" for intent ${intentName}: ${error.message}`);
                            }
                        }
                    }
                }
            }
        }

        res.status(200).json({
            message: 'YAML data extracted successfully',
            stats
        });
    } catch (err) {
        console.error('Extraction error:', err);
        res.status(500).json({
            error: 'YAML extraction failed',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

module.exports = router;