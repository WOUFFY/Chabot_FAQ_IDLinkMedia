const express = require('express');
const router = express.Router();
const { writeYAMLFiles } = require('../utils/yamlWriter');
const { trainRasaModel, getTrainingData, updateTrainingData, removeTrainingDataElement } = require('../services/rasaTrainer');
const { Intent, IntentExample, Story, StoryStep, Rule, RuleStep, DomainResponse, DomainIntent, SessionConfig, ResponseTemplate } = require('../models');


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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Training complete
 *                 model:
 *                   type: string
 *                   example: model_1622128812345.tar.gz
 *       500:
 *         description: Training failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/train', async (req, res) => {
    try {
        // Load all data from database
        const intents = await Intent.findAll({ include: IntentExample });
        const stories = await Story.findAll({ include: StoryStep });
        const rules = await Rule.findAll({ include: RuleStep });

        // Transform database objects into the structure needed for YAML generation
        const transformedIntents = intents.map(i => ({
            name: i.name,
            examples: i.IntentExamples.map(e => e.text)
        }));

        const transformedStories = stories.map(s => ({
            name: s.name,
            steps: s.StorySteps
        }));

        const transformedRules = rules.map(r => ({
            name: r.name,
            steps: r.RuleSteps
        }));

        // Generate YAML files from transformed data
        await writeYAMLFiles({ intents: transformedIntents, stories: transformedStories, rules: transformedRules });

        // Trigger Rasa training process and get model filename
        const model = await trainRasaModel();

        // Return success with model information
        res.status(200).json({ message: 'Training complete', model });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Training failed' });
    }
});

/* INTENT CRUD OPERATIONS */

/**
 * @swagger
 * /api/intents:
 *   get:
 *     summary: Get all intents
 *     description: Retrieve all intents with their examples from the database
 *     tags: [Intents]
 *     responses:
 *       200:
 *         description: A list of intents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Intent'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/intents', async (req, res) => {
    try {
        const intents = await Intent.findAll({ include: IntentExample });
        res.status(200).json(intents);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve intents' });
    }
});

/**
 * @swagger
 * /api/intents/{id}:
 *   get:
 *     summary: Get a specific intent
 *     description: Retrieve a specific intent with its examples by ID
 *     tags: [Intents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The intent ID
 *     responses:
 *       200:
 *         description: The intent object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Intent'
 *       404:
 *         description: Intent not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/intents/:id', async (req, res) => {
    try {
        const intent = await Intent.findByPk(req.params.id, { include: IntentExample });
        if (!intent) {
            return res.status(404).json({ error: 'Intent not found' });
        }
        res.status(200).json(intent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve intent' });
    }
});

/**
 * @swagger
 * /api/intents:
 *   post:
 *     summary: Create a new intent
 *     description: Create a new intent with optional examples
 *     tags: [Intents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Intent name
 *               examples:
 *                 type: array
 *                 description: Example utterances
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Created intent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Intent'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/intents', async (req, res) => {
    try {
        const { name, examples } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Intent name is required' });
        }

        const intent = await Intent.create({ name });

        // Create examples if provided
        if (examples && Array.isArray(examples)) {
            await Promise.all(examples.map(text =>
                IntentExample.create({ text, IntentId: intent.id })
            ));
        }

        const createdIntent = await Intent.findByPk(intent.id, { include: IntentExample });
        res.status(201).json(createdIntent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create intent' });
    }
});

/**
 * @swagger
 * /api/intents/{id}:
 *   put:
 *     summary: Update an intent
 *     description: Update an existing intent and its examples
 *     tags: [Intents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The intent ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New intent name
 *               examples:
 *                 type: array
 *                 description: New example utterances (replaces all existing)
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Updated intent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Intent'
 *       404:
 *         description: Intent not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/intents/:id', async (req, res) => {
    try {
        const { name, examples } = req.body;
        const intentId = req.params.id;

        const intent = await Intent.findByPk(intentId);
        if (!intent) {
            return res.status(404).json({ error: 'Intent not found' });
        }

        // Update intent name if provided
        if (name) {
            await intent.update({ name });
        }

        // Update examples if provided
        if (examples && Array.isArray(examples)) {
            // First delete existing examples
            await IntentExample.destroy({ where: { IntentId: intentId } });

            // Then create new examples
            await Promise.all(examples.map(text =>
                IntentExample.create({ text, IntentId: intentId })
            ));
        }

        const updatedIntent = await Intent.findByPk(intentId, { include: IntentExample });
        res.status(200).json(updatedIntent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update intent' });
    }
});

/**
 * @swagger
 * /api/intents/{id}:
 *   delete:
 *     summary: Delete an intent
 *     description: Delete an intent and all its examples
 *     tags: [Intents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The intent ID
 *     responses:
 *       200:
 *         description: Intent deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Intent deleted successfully
 *       404:
 *         description: Intent not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/intents/:id', async (req, res) => {
    try {
        const intentId = req.params.id;
        const intent = await Intent.findByPk(intentId);

        if (!intent) {
            return res.status(404).json({ error: 'Intent not found' });
        }

        // Delete examples first (cascade delete should handle this, but being explicit)
        await IntentExample.destroy({ where: { IntentId: intentId } });

        // Delete the intent
        await intent.destroy();

        res.status(200).json({ message: 'Intent deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete intent' });
    }
});

/* STORY CRUD OPERATIONS */

/**
 * @swagger
 * /api/stories:
 *   get:
 *     summary: Get all stories
 *     description: Retrieve all stories with their steps
 *     tags: [Stories]
 *     responses:
 *       200:
 *         description: A list of stories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Story'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stories', async (req, res) => {
    try {
        const stories = await Story.findAll({ include: StoryStep });
        res.status(200).json(stories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve stories' });
    }
});

/**
 * @swagger
 * /api/stories/{id}:
 *   get:
 *     summary: Get a specific story
 *     description: Retrieve a specific story with its steps
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The story ID
 *     responses:
 *       200:
 *         description: The story object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Story'
 *       404:
 *         description: Story not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stories/:id', async (req, res) => {
    try {
        const story = await Story.findByPk(req.params.id, { include: StoryStep });
        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }
        res.status(200).json(story);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve story' });
    }
});

/**
 * @swagger
 * /api/stories:
 *   post:
 *     summary: Create a new story
 *     description: Create a new story with optional steps
 *     tags: [Stories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Story name
 *               steps:
 *                 type: array
 *                 description: Story steps
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [intent, action]
 *                     name:
 *                       type: string
 *     responses:
 *       201:
 *         description: Created story
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Story'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/stories', async (req, res) => {
    try {
        const { name, steps } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Story name is required' });
        }

        const story = await Story.create({ name });

        // Create steps if provided
        if (steps && Array.isArray(steps)) {
            await Promise.all(steps.map(step =>
                StoryStep.create({ ...step, StoryId: story.id })
            ));
        }

        const createdStory = await Story.findByPk(story.id, { include: StoryStep });
        res.status(201).json(createdStory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create story' });
    }
});

/**
 * @swagger
 * /api/stories/{id}:
 *   put:
 *     summary: Update a story
 *     description: Update an existing story and its steps
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The story ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               steps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [intent, action]
 *                     name:
 *                       type: string
 *     responses:
 *       200:
 *         description: Updated story
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Story'
 *       404:
 *         description: Story not found
 *       500:
 *         description: Server error
 */
router.put('/stories/:id', async (req, res) => {
    try {
        const { name, steps } = req.body;
        const storyId = req.params.id;

        const story = await Story.findByPk(storyId);
        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        // Update story name if provided
        if (name) {
            await story.update({ name });
        }

        // Update steps if provided
        if (steps && Array.isArray(steps)) {
            // First delete existing steps
            await StoryStep.destroy({ where: { StoryId: storyId } });

            // Then create new steps
            await Promise.all(steps.map(step =>
                StoryStep.create({ ...step, StoryId: storyId })
            ));
        }

        const updatedStory = await Story.findByPk(storyId, { include: StoryStep });
        res.status(200).json(updatedStory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update story' });
    }
});

/**
 * @swagger
 * /api/stories/{id}:
 *   delete:
 *     summary: Delete a story
 *     description: Delete a story and all its steps
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The story ID
 *     responses:
 *       200:
 *         description: Story deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Story not found
 *       500:
 *         description: Server error
 */
router.delete('/stories/:id', async (req, res) => {
    try {
        const storyId = req.params.id;
        const story = await Story.findByPk(storyId);

        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        // Delete steps first (cascade delete should handle this, but being explicit)
        await StoryStep.destroy({ where: { StoryId: storyId } });

        // Delete the story
        await story.destroy();

        res.status(200).json({ message: 'Story deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete story' });
    }
});

/* RULE CRUD OPERATIONS */

/**
 * @swagger
 * /api/rules:
 *   get:
 *     summary: Get all rules
 *     description: Retrieve all rules with their steps
 *     tags: [Rules]
 *     responses:
 *       200:
 *         description: A list of rules
 *       500:
 *         description: Server error
 */
router.get('/rules', async (req, res) => {
    try {
        const rules = await Rule.findAll({ include: RuleStep });
        res.status(200).json(rules);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve rules' });
    }
});

/**
 * @swagger
 * /api/rules/{id}:
 *   get:
 *     summary: Get a specific rule
 *     description: Retrieve a specific rule with its steps
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The rule object
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
router.get('/rules/:id', async (req, res) => {
    try {
        const rule = await Rule.findByPk(req.params.id, { include: RuleStep });
        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }
        res.status(200).json(rule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve rule' });
    }
});

/**
 * @swagger
 * /api/rules:
 *   post:
 *     summary: Create a new rule
 *     description: Create a new rule with optional steps
 *     tags: [Rules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               steps:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Created rule
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/rules', async (req, res) => {
    try {
        const { name, steps } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Rule name is required' });
        }

        const rule = await Rule.create({ name });

        // Create steps if provided
        if (steps && Array.isArray(steps)) {
            await Promise.all(steps.map(step =>
                RuleStep.create({ ...step, RuleId: rule.id })
            ));
        }

        const createdRule = await Rule.findByPk(rule.id, { include: RuleStep });
        res.status(201).json(createdRule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create rule' });
    }
});

/**
 * @swagger
 * /api/rules/{id}:
 *   put:
 *     summary: Update a rule
 *     description: Update an existing rule and its steps
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated rule
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
router.put('/rules/:id', async (req, res) => {
    try {
        const { name, steps } = req.body;
        const ruleId = req.params.id;

        const rule = await Rule.findByPk(ruleId);
        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        // Update rule name if provided
        if (name) {
            await rule.update({ name });
        }

        // Update steps if provided
        if (steps && Array.isArray(steps)) {
            // First delete existing steps
            await RuleStep.destroy({ where: { RuleId: ruleId } });

            // Then create new steps
            await Promise.all(steps.map(step =>
                RuleStep.create({ ...step, RuleId: ruleId })
            ));
        }

        const updatedRule = await Rule.findByPk(ruleId, { include: RuleStep });
        res.status(200).json(updatedRule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update rule' });
    }
});

/**
 * @swagger
 * /api/rules/{id}:
 *   delete:
 *     summary: Delete a rule
 *     description: Delete a rule and all its steps
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rule deleted successfully
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
router.delete('/rules/:id', async (req, res) => {
    try {
        const ruleId = req.params.id;
        const rule = await Rule.findByPk(ruleId);

        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        // Delete steps first (cascade delete should handle this, but being explicit)
        await RuleStep.destroy({ where: { RuleId: ruleId } });

        // Delete the rule
        await rule.destroy();

        res.status(200).json({ message: 'Rule deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete rule' });
    }
});

/* INTENT EXAMPLE CRUD OPERATIONS */

/**
 * @swagger
 * /api/intent-examples:
 *   get:
 *     summary: Get all intent examples
 *     description: Retrieve all intent examples
 *     tags: [Intent Examples]
 *     responses:
 *       200:
 *         description: A list of intent examples
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   text:
 *                     type: string
 *                   IntentId:
 *                     type: integer
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */
router.get('/intent-examples', async (req, res) => {
    try {
        const examples = await IntentExample.findAll({
            include: [{ model: Intent, attributes: ['name'] }]
        });
        res.status(200).json(examples);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve intent examples' });
    }
});

/**
 * @swagger
 * /api/intent-examples/{id}:
 *   get:
 *     summary: Get a specific intent example
 *     description: Retrieve a specific intent example by ID
 *     tags: [Intent Examples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The intent example ID
 *     responses:
 *       200:
 *         description: The intent example
 *       404:
 *         description: Intent example not found
 *       500:
 *         description: Server error
 */
router.get('/intent-examples/:id', async (req, res) => {
    try {
        const example = await IntentExample.findByPk(req.params.id, {
            include: [{ model: Intent, attributes: ['name'] }]
        });

        if (!example) {
            return res.status(404).json({ error: 'Intent example not found' });
        }

        res.status(200).json(example);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve intent example' });
    }
});

/**
 * @swagger
 * /api/intent-examples:
 *   post:
 *     summary: Create a new intent example
 *     description: Add a new example to an intent
 *     tags: [Intent Examples]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - IntentId
 *             properties:
 *               text:
 *                 type: string
 *                 description: The example text
 *               IntentId:
 *                 type: integer
 *                 description: The ID of the intent this example belongs to
 *     responses:
 *       201:
 *         description: Created intent example
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Referenced intent not found
 *       500:
 *         description: Server error
 */
router.post('/intent-examples', async (req, res) => {
    try {
        const { text, IntentId } = req.body;

        if (!text || !IntentId) {
            return res.status(400).json({ error: 'Text and IntentId are required' });
        }

        // Check if the intent exists
        const intent = await Intent.findByPk(IntentId);
        if (!intent) {
            return res.status(404).json({ error: 'Intent not found' });
        }

        const example = await IntentExample.create({ text, IntentId });
        res.status(201).json(example);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create intent example' });
    }
});

/**
 * @swagger
 * /api/intent-examples/{id}:
 *   put:
 *     summary: Update an intent example
 *     description: Update an existing intent example
 *     tags: [Intent Examples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The intent example ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The new example text
 *               IntentId:
 *                 type: integer
 *                 description: The ID of the intent this example belongs to
 *     responses:
 *       200:
 *         description: Updated intent example
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Intent example or referenced intent not found
 *       500:
 *         description: Server error
 */
router.put('/intent-examples/:id', async (req, res) => {
    try {
        const { text, IntentId } = req.body;
        const exampleId = req.params.id;

        const example = await IntentExample.findByPk(exampleId);
        if (!example) {
            return res.status(404).json({ error: 'Intent example not found' });
        }

        // If IntentId is provided, check if the intent exists
        if (IntentId) {
            const intent = await Intent.findByPk(IntentId);
            if (!intent) {
                return res.status(404).json({ error: 'Intent not found' });
            }
        }

        // Update the example
        const updateData = {};
        if (text) updateData.text = text;
        if (IntentId) updateData.IntentId = IntentId;

        await example.update(updateData);

        const updatedExample = await IntentExample.findByPk(exampleId, {
            include: [{ model: Intent, attributes: ['name'] }]
        });

        res.status(200).json(updatedExample);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update intent example' });
    }
});

/**
 * @swagger
 * /api/intent-examples/{id}:
 *   delete:
 *     summary: Delete an intent example
 *     description: Remove an intent example
 *     tags: [Intent Examples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The intent example ID
 *     responses:
 *       200:
 *         description: Intent example deleted successfully
 *       404:
 *         description: Intent example not found
 *       500:
 *         description: Server error
 */
router.delete('/intent-examples/:id', async (req, res) => {
    try {
        const exampleId = req.params.id;
        const example = await IntentExample.findByPk(exampleId);

        if (!example) {
            return res.status(404).json({ error: 'Intent example not found' });
        }

        await example.destroy();
        res.status(200).json({ message: 'Intent example deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete intent example' });
    }
});

/* STORY STEP CRUD OPERATIONS */

/**
 * @swagger
 * /api/story-steps:
 *   get:
 *     summary: Get all story steps
 *     description: Retrieve all story steps
 *     tags: [Story Steps]
 *     responses:
 *       200:
 *         description: A list of story steps
 *       500:
 *         description: Server error
 */
router.get('/story-steps', async (req, res) => {
    try {
        const steps = await StoryStep.findAll({
            include: [{ model: Story, attributes: ['name'] }],
            order: [['StoryId', 'ASC'], ['order', 'ASC']]
        });
        res.status(200).json(steps);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve story steps' });
    }
});

/**
 * @swagger
 * /api/story-steps/{id}:
 *   get:
 *     summary: Get a specific story step
 *     description: Retrieve a specific story step by ID
 *     tags: [Story Steps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The story step ID
 *     responses:
 *       200:
 *         description: The story step
 *       404:
 *         description: Story step not found
 *       500:
 *         description: Server error
 */
router.get('/story-steps/:id', async (req, res) => {
    try {
        const step = await StoryStep.findByPk(req.params.id, {
            include: [{ model: Story, attributes: ['name'] }]
        });

        if (!step) {
            return res.status(404).json({ error: 'Story step not found' });
        }

        res.status(200).json(step);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve story step' });
    }
});

/**
 * @swagger
 * /api/story-steps:
 *   post:
 *     summary: Create a new story step
 *     description: Add a new step to a story
 *     tags: [Story Steps]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *               - StoryId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [intent, action]
 *               name:
 *                 type: string
 *               order:
 *                 type: integer
 *               StoryId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Created story step
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Referenced story not found
 *       500:
 *         description: Server error
 */
router.post('/story-steps', async (req, res) => {
    try {
        const { type, name, order, StoryId } = req.body;

        if (!type || !name || !StoryId) {
            return res.status(400).json({ error: 'Type, name, and StoryId are required' });
        }

        if (type !== 'intent' && type !== 'action') {
            return res.status(400).json({ error: 'Type must be either "intent" or "action"' });
        }

        // Check if the story exists
        const story = await Story.findByPk(StoryId);
        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        // If order is not provided, place at the end
        let nextOrder = 0;
        if (order === undefined) {
            const lastStep = await StoryStep.findOne({
                where: { StoryId },
                order: [['order', 'DESC']]
            });

            nextOrder = lastStep ? lastStep.order + 1 : 0;
        } else {
            nextOrder = order;
        }

        const step = await StoryStep.create({
            type,
            name,
            order: nextOrder,
            StoryId
        });

        res.status(201).json(step);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create story step' });
    }
});

/**
 * @swagger
 * /api/story-steps/{id}:
 *   put:
 *     summary: Update a story step
 *     description: Update an existing story step
 *     tags: [Story Steps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The story step ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [intent, action]
 *               name:
 *                 type: string
 *               order:
 *                 type: integer
 *               StoryId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated story step
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Story step or referenced story not found
 *       500:
 *         description: Server error
 */
router.put('/story-steps/:id', async (req, res) => {
    try {
        const { type, name, order, StoryId } = req.body;
        const stepId = req.params.id;

        const step = await StoryStep.findByPk(stepId);
        if (!step) {
            return res.status(404).json({ error: 'Story step not found' });
        }

        // If type is provided, validate it
        if (type && type !== 'intent' && type !== 'action') {
            return res.status(400).json({ error: 'Type must be either "intent" or "action"' });
        }

        // If StoryId is provided, check if the story exists
        if (StoryId) {
            const story = await Story.findByPk(StoryId);
            if (!story) {
                return res.status(404).json({ error: 'Story not found' });
            }
        }

        // Update the step
        const updateData = {};
        if (type) updateData.type = type;
        if (name) updateData.name = name;
        if (order !== undefined) updateData.order = order;
        if (StoryId) updateData.StoryId = StoryId;

        await step.update(updateData);

        const updatedStep = await StoryStep.findByPk(stepId, {
            include: [{ model: Story, attributes: ['name'] }]
        });

        res.status(200).json(updatedStep);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update story step' });
    }
});

/**
 * @swagger
 * /api/story-steps/{id}:
 *   delete:
 *     summary: Delete a story step
 *     description: Remove a story step
 *     tags: [Story Steps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The story step ID
 *     responses:
 *       200:
 *         description: Story step deleted successfully
 *       404:
 *         description: Story step not found
 *       500:
 *         description: Server error
 */
router.delete('/story-steps/:id', async (req, res) => {
    try {
        const stepId = req.params.id;
        const step = await StoryStep.findByPk(stepId);

        if (!step) {
            return res.status(404).json({ error: 'Story step not found' });
        }

        await step.destroy();
        res.status(200).json({ message: 'Story step deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete story step' });
    }
});

/* RULE STEP CRUD OPERATIONS */

/**
 * @swagger
 * /api/rule-steps:
 *   get:
 *     summary: Get all rule steps
 *     description: Retrieve all rule steps
 *     tags: [Rule Steps]
 *     responses:
 *       200:
 *         description: A list of rule steps
 *       500:
 *         description: Server error
 */
router.get('/rule-steps', async (req, res) => {
    try {
        const steps = await RuleStep.findAll({
            include: [{ model: Rule, attributes: ['name'] }],
            order: [['RuleId', 'ASC'], ['order', 'ASC']]
        });
        res.status(200).json(steps);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve rule steps' });
    }
});

/**
 * @swagger
 * /api/rule-steps/{id}:
 *   get:
 *     summary: Get a specific rule step
 *     description: Retrieve a specific rule step by ID
 *     tags: [Rule Steps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The rule step ID
 *     responses:
 *       200:
 *         description: The rule step
 *       404:
 *         description: Rule step not found
 *       500:
 *         description: Server error
 */
router.get('/rule-steps/:id', async (req, res) => {
    try {
        const step = await RuleStep.findByPk(req.params.id, {
            include: [{ model: Rule, attributes: ['name'] }]
        });

        if (!step) {
            return res.status(404).json({ error: 'Rule step not found' });
        }

        res.status(200).json(step);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve rule step' });
    }
});

/**
 * @swagger
 * /api/rule-steps:
 *   post:
 *     summary: Create a new rule step
 *     description: Add a new step to a rule
 *     tags: [Rule Steps]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *               - RuleId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [intent, action]
 *               name:
 *                 type: string
 *               order:
 *                 type: integer
 *               RuleId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Created rule step
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Referenced rule not found
 *       500:
 *         description: Server error
 */
router.post('/rule-steps', async (req, res) => {
    try {
        const { type, name, order, RuleId } = req.body;

        if (!type || !name || !RuleId) {
            return res.status(400).json({ error: 'Type, name, and RuleId are required' });
        }

        if (type !== 'intent' && type !== 'action') {
            return res.status(400).json({ error: 'Type must be either "intent" or "action"' });
        }

        // Check if the rule exists
        const rule = await Rule.findByPk(RuleId);
        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        // If order is not provided, place at the end
        let nextOrder = 0;
        if (order === undefined) {
            const lastStep = await RuleStep.findOne({
                where: { RuleId },
                order: [['order', 'DESC']]
            });

            nextOrder = lastStep ? lastStep.order + 1 : 0;
        } else {
            nextOrder = order;
        }

        const step = await RuleStep.create({
            type,
            name,
            order: nextOrder,
            RuleId
        });

        res.status(201).json(step);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create rule step' });
    }
});

/**
 * @swagger
 * /api/rule-steps/{id}:
 *   put:
 *     summary: Update a rule step
 *     description: Update an existing rule step
 *     tags: [Rule Steps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The rule step ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [intent, action]
 *               name:
 *                 type: string
 *               order:
 *                 type: integer
 *               RuleId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated rule step
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Rule step or referenced rule not found
 *       500:
 *         description: Server error
 */
router.put('/rule-steps/:id', async (req, res) => {
    try {
        const { type, name, order, RuleId } = req.body;
        const stepId = req.params.id;

        const step = await RuleStep.findByPk(stepId);
        if (!step) {
            return res.status(404).json({ error: 'Rule step not found' });
        }

        // If type is provided, validate it
        if (type && type !== 'intent' && type !== 'action') {
            return res.status(400).json({ error: 'Type must be either "intent" or "action"' });
        }

        // If RuleId is provided, check if the rule exists
        if (RuleId) {
            const rule = await Rule.findByPk(RuleId);
            if (!rule) {
                return res.status(404).json({ error: 'Rule not found' });
            }
        }

        // Update the step
        const updateData = {};
        if (type) updateData.type = type;
        if (name) updateData.name = name;
        if (order !== undefined) updateData.order = order;
        if (RuleId) updateData.RuleId = RuleId;

        await step.update(updateData);

        const updatedStep = await RuleStep.findByPk(stepId, {
            include: [{ model: Rule, attributes: ['name'] }]
        });

        res.status(200).json(updatedStep);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update rule step' });
    }
});

/**
 * @swagger
 * /api/rule-steps/{id}:
 *   delete:
 *     summary: Delete a rule step
 *     description: Remove a rule step
 *     tags: [Rule Steps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The rule step ID
 *     responses:
 *       200:
 *         description: Rule step deleted successfully
 *       404:
 *         description: Rule step not found
 *       500:
 *         description: Server error
 */
router.delete('/rule-steps/:id', async (req, res) => {
    try {
        const stepId = req.params.id;
        const step = await RuleStep.findByPk(stepId);

        if (!step) {
            return res.status(404).json({ error: 'Rule step not found' });
        }

        await step.destroy();
        res.status(200).json({ message: 'Rule step deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete rule step' });
    }
});

/* DOMAIN CONFIGURATION CRUD OPERATIONS (DATABASE BASED) */

/**
 * @swagger
 * /api/domain-db:
 *   get:
 *     summary: Get complete domain configuration from database
 *     description: Retrieve the complete Rasa domain configuration from the database
 *     tags: [Domain Database]
 *     responses:
 *       200:
 *         description: Domain configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                 intents:
 *                   type: array
 *                   items:
 *                     type: string
 *                 responses:
 *                   type: object
 *                 session_config:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/domain-db', async (req, res) => {
    try {
        // Get intents from database
        const intents = await DomainIntent.findAll();
        const intentNames = intents.map(intent => intent.name);

        // Get responses from database
        const responses = await DomainResponse.findAll({
            include: [ResponseTemplate]
        });

        // Format responses as expected in domain.yml
        const formattedResponses = {};
        responses.forEach(response => {
            const templates = response.ResponseTemplates.map(template => {
                const templateObj = {};

                if (template.text) templateObj.text = template.text;
                if (template.buttons) templateObj.buttons = template.buttons;
                if (template.image) templateObj.image = template.image;
                if (template.custom) {
                    Object.assign(templateObj, template.custom);
                }

                return templateObj;
            });

            formattedResponses[response.name] = templates;
        });

        // Get session config
        const sessionConfig = await SessionConfig.findOne({ where: { id: 1 } });
        const formattedSessionConfig = sessionConfig ? {
            session_expiration_time: sessionConfig.session_expiration_time,
            carry_over_slots_to_new_session: sessionConfig.carry_over_slots_to_new_session
        } : {
            session_expiration_time: 60,
            carry_over_slots_to_new_session: true
        };

        // Assemble domain object
        const domain = {
            version: "3.1",
            intents: intentNames,
            responses: formattedResponses,
            session_config: formattedSessionConfig
        };

        res.status(200).json(domain);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve domain configuration from database' });
    }
});

/**
 * @swagger
 * /api/domain-db/intents:
 *   get:
 *     summary: Get all domain intents from database
 *     description: Retrieve all domain intents from the database
 *     tags: [Domain Database]
 *     responses:
 *       200:
 *         description: List of intent objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/domain-db/intents', async (req, res) => {
    try {
        const intents = await DomainIntent.findAll();
        res.status(200).json(intents);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve domain intents from database' });
    }
});

/**
 * @swagger
 * /api/domain-db/intents/{id}:
 *   get:
 *     summary: Get a specific domain intent
 *     description: Retrieve a specific domain intent by ID
 *     tags: [Domain Database]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Intent ID
 *     responses:
 *       200:
 *         description: Intent object
 *       404:
 *         description: Intent not found
 *       500:
 *         description: Server error
 */
router.get('/domain-db/intents/:id', async (req, res) => {
    try {
        const intent = await DomainIntent.findByPk(req.params.id);

        if (!intent) {
            return res.status(404).json({ error: 'Domain intent not found' });
        }

        res.status(200).json(intent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve domain intent from database' });
    }
});

/**
 * @swagger
 * /api/domain-db/intents:
 *   post:
 *     summary: Create a new domain intent
 *     description: Add a new intent to the domain database
 *     tags: [Domain Database]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The intent name
 *     responses:
 *       201:
 *         description: Intent created successfully
 *       400:
 *         description: Invalid input or intent already exists
 *       500:
 *         description: Server error
 */
router.post('/domain-db/intents', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Intent name is required' });
        }

        // Check if intent already exists
        const existingIntent = await DomainIntent.findOne({ where: { name } });
        if (existingIntent) {
            return res.status(400).json({ error: 'Intent with this name already exists' });
        }

        // Create new intent
        const intent = await DomainIntent.create({ name });

        res.status(201).json(intent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create domain intent' });
    }
});

/**
 * @swagger
 * /api/domain-db/intents/{id}:
 *   put:
 *     summary: Update domain intent
 *     description: Update an existing domain intent
 *     tags: [Domain Database]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Intent ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: New intent name
 *     responses:
 *       200:
 *         description: Intent updated successfully
 *       400:
 *         description: Invalid input or name already in use
 *       404:
 *         description: Intent not found
 *       500:
 *         description: Server error
 */
router.put('/domain-db/intents/:id', async (req, res) => {
    try {
        const { name } = req.body;
        const intentId = req.params.id;

        if (!name) {
            return res.status(400).json({ error: 'Intent name is required' });
        }

        // Find intent
        const intent = await DomainIntent.findByPk(intentId);
        if (!intent) {
            return res.status(404).json({ error: 'Domain intent not found' });
        }

        // Check if name is already in use by another intent
        if (name !== intent.name) {
            const existingIntent = await DomainIntent.findOne({ where: { name } });
            if (existingIntent) {
                return res.status(400).json({ error: 'Intent name already in use' });
            }
        }

        // Update intent
        await intent.update({ name });

        res.status(200).json(intent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update domain intent' });
    }
});

/**
 * @swagger
 * /api/domain-db/intents/{id}:
 *   delete:
 *     summary: Delete domain intent
 *     description: Remove an intent from the domain database
 *     tags: [Domain Database]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Intent ID
 *     responses:
 *       200:
 *         description: Intent deleted successfully
 *       404:
 *         description: Intent not found
 *       500:
 *         description: Server error
 */
router.delete('/domain-db/intents/:id', async (req, res) => {
    try {
        const intentId = req.params.id;

        // Find intent
        const intent = await DomainIntent.findByPk(intentId);
        if (!intent) {
            return res.status(404).json({ error: 'Domain intent not found' });
        }

        // Delete intent
        await intent.destroy();

        res.status(200).json({ message: 'Domain intent deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete domain intent' });
    }
});

/**
 * @swagger
 * /api/domain-db/responses:
 *   get:
 *     summary: Get all domain responses
 *     description: Retrieve all response templates from the database
 *     tags: [Domain Database]
 *     responses:
 *       200:
 *         description: List of response objects with templates
 *       500:
 *         description: Server error
 */
router.get('/domain-db/responses', async (req, res) => {
    try {
        const responses = await DomainResponse.findAll({
            include: [ResponseTemplate]
        });
        res.status(200).json(responses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve domain responses from database' });
    }
});

/**
 * @swagger
 * /api/domain-db/responses/{id}:
 *   get:
 *     summary: Get a specific domain response
 *     description: Retrieve a specific response with its templates
 *     tags: [Domain Database]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Response ID
 *     responses:
 *       200:
 *         description: Response object with templates
 *       404:
 *         description: Response not found
 *       500:
 *         description: Server error
 */
router.get('/domain-db/responses/:id', async (req, res) => {
    try {
        const response = await DomainResponse.findByPk(req.params.id, {
            include: [ResponseTemplate]
        });

        if (!response) {
            return res.status(404).json({ error: 'Domain response not found' });
        }

        res.status(200).json(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve domain response from database' });
    }
});

/**
 * @swagger
 * /api/domain-db/responses:
 *   post:
 *     summary: Create a new response
 *     description: Add a new response with templates to the domain database
 *     tags: [Domain Database]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - templates
 *             properties:
 *               name:
 *                 type: string
 *                 description: Response name (e.g., utter_greet)
 *               templates:
 *                 type: array
 *                 description: Array of templates
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Response created successfully
 *       400:
 *         description: Invalid input or response already exists
 *       500:
 *         description: Server error
 */
router.post('/domain-db/responses', async (req, res) => {
    try {
        const { name, templates } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Response name is required' });
        }

        if (!templates || !Array.isArray(templates) || templates.length === 0) {
            return res.status(400).json({ error: 'At least one template is required' });
        }

        // Check if response already exists
        const existingResponse = await DomainResponse.findOne({ where: { name } });
        if (existingResponse) {
            return res.status(400).json({ error: 'Response with this name already exists' });
        }

        // Create response
        const response = await DomainResponse.create({ name });

        // Create templates
        for (const template of templates) {
            const { text, buttons, image, ...customProps } = template;

            await ResponseTemplate.create({
                text: text || null,
                buttons: buttons || null,
                image: image || null,
                custom: Object.keys(customProps).length > 0 ? customProps : null,
                DomainResponseId: response.id
            });
        }

        // Get created response with templates
        const createdResponse = await DomainResponse.findByPk(response.id, {
            include: [ResponseTemplate]
        });

        res.status(201).json(createdResponse);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create domain response' });
    }
});

/**
 * @swagger
 * /api/domain-db/responses/{id}:
 *   put:
 *     summary: Update a domain response
 *     description: Update a response and its templates
 *     tags: [Domain Database]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Response ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               templates:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Response updated successfully
 *       404:
 *         description: Response not found
 *       400:
 *         description: Invalid input or name already in use
 *       500:
 *         description: Server error
 */
router.put('/domain-db/responses/:id', async (req, res) => {
    try {
        const { name, templates } = req.body;
        const responseId = req.params.id;

        // Find response
        const response = await DomainResponse.findByPk(responseId);
        if (!response) {
            return res.status(404).json({ error: 'Domain response not found' });
        }

        // Update response name if provided
        if (name) {
            // Check if name is already in use by another response
            if (name !== response.name) {
                const existingResponse = await DomainResponse.findOne({ where: { name } });
                if (existingResponse) {
                    return res.status(400).json({ error: 'Response name already in use' });
                }
            }

            await response.update({ name });
        }

        // Update templates if provided
        if (templates && Array.isArray(templates)) {
            // Delete existing templates
            await ResponseTemplate.destroy({ where: { DomainResponseId: responseId } });

            // Create new templates
            for (const template of templates) {
                const { text, buttons, image, ...customProps } = template;

                await ResponseTemplate.create({
                    text: text || null,
                    buttons: buttons || null,
                    image: image || null,
                    custom: Object.keys(customProps).length > 0 ? customProps : null,
                    DomainResponseId: responseId
                });
            }
        }

        // Get updated response with templates
        const updatedResponse = await DomainResponse.findByPk(responseId, {
            include: [ResponseTemplate]
        });

        res.status(200).json(updatedResponse);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update domain response' });
    }
});

/**
 * @swagger
 * /api/domain-db/responses/{id}:
 *   delete:
 *     summary: Delete a domain response
 *     description: Delete a response and all its templates
 *     tags: [Domain Database]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Response ID
 *     responses:
 *       200:
 *         description: Response deleted successfully
 *       404:
 *         description: Response not found
 *       500:
 *         description: Server error
 */
router.delete('/domain-db/responses/:id', async (req, res) => {
    try {
        const responseId = req.params.id;

        // Find response
        const response = await DomainResponse.findByPk(responseId);
        if (!response) {
            return res.status(404).json({ error: 'Domain response not found' });
        }

        // Delete response (cascade delete will remove templates)
        await response.destroy();

        res.status(200).json({ message: 'Domain response deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete domain response' });
    }
});

/**
 * @swagger
 * /api/domain-db/session-config:
 *   get:
 *     summary: Get session configuration
 *     description: Get session configuration from database
 *     tags: [Domain Database]
 *     responses:
 *       200:
 *         description: Session configuration object
 *       500:
 *         description: Server error
 */
router.get('/domain-db/session-config', async (req, res) => {
    try {
        // Get session config
        const sessionConfig = await SessionConfig.findOne({ where: { id: 1 } });

        if (!sessionConfig) {
            return res.status(200).json({
                session_expiration_time: 60,
                carry_over_slots_to_new_session: true
            });
        }

        res.status(200).json({
            session_expiration_time: sessionConfig.session_expiration_time,
            carry_over_slots_to_new_session: sessionConfig.carry_over_slots_to_new_session
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve session configuration from database' });
    }
});

/**
 * @swagger
 * /api/domain-db/session-config:
 *   put:
 *     summary: Update session configuration
 *     description: Update session configuration in database
 *     tags: [Domain Database]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_expiration_time:
 *                 type: integer
 *               carry_over_slots_to_new_session:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Session configuration updated successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.put('/domain-db/session-config', async (req, res) => {
    try {
        const { session_expiration_time, carry_over_slots_to_new_session } = req.body;

        if (session_expiration_time === undefined && carry_over_slots_to_new_session === undefined) {
            return res.status(400).json({
                error: 'At least one session configuration parameter is required'
            });
        }

        // Find or create session config
        let [sessionConfig] = await SessionConfig.findOrCreate({
            where: { id: 1 },
            defaults: {
                session_expiration_time: 60,
                carry_over_slots_to_new_session: true
            }
        });

        // Prepare update data
        const updateData = {};
        if (session_expiration_time !== undefined) {
            updateData.session_expiration_time = session_expiration_time;
        }
        if (carry_over_slots_to_new_session !== undefined) {
            updateData.carry_over_slots_to_new_session = carry_over_slots_to_new_session;
        }

        // Update session config
        await sessionConfig.update(updateData);

        res.status(200).json({
            session_expiration_time: sessionConfig.session_expiration_time,
            carry_over_slots_to_new_session: sessionConfig.carry_over_slots_to_new_session
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update session configuration' });
    }
});

/**
 * @swagger
 * /api/train-db:
 *   post:
 *     summary: Train a new Rasa model from database
 *     description: Generates YAML files from database records, triggers Rasa training
 *     tags: [Domain Database]
 *     responses:
 *       200:
 *         description: Training completed successfully
 *       500:
 *         description: Training failed
 */
router.post('/train-db', async (req, res) => {
    try {


        // Load all data from database
        const intents = await Intent.findAll({ include: IntentExample });
        const stories = await Story.findAll({ include: StoryStep });
        const rules = await Rule.findAll({ include: RuleStep });

        // Transform database objects into the structure needed for YAML generation
        const transformedIntents = intents.map(i => ({
            name: i.name,
            examples: i.IntentExamples.map(e => e.text)
        }));

        const transformedStories = stories.map(s => ({
            name: s.name,
            steps: s.StorySteps.map(step => ({
                type: step.type,
                name: step.name,
                order: step.order
            }))
        }));

        const transformedRules = rules.map(r => ({
            name: r.name,
            steps: r.RuleSteps.map(step => ({
                type: step.type,
                name: step.name,
                order: step.order
            }))
        }));

        // Generate YAML files from transformed data
        await writeYAMLFiles({
            intents: transformedIntents,
            stories: transformedStories,
            rules: transformedRules
        });

        // Trigger Rasa training process and get model filename
        const model = await trainRasaModel();

        // Return success with model information
        res.status(200).json({
            message: 'Training complete using database configuration',
            model
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Training failed: ' + err.message });
    }
});

module.exports = router;