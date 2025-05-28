const express = require('express');
const router = express.Router();
const { writeYAMLFiles } = require('../utils/yamlWriter');
const { trainRasaModel, getTrainingData, updateTrainingData, removeTrainingDataElement } = require('../services/rasaTrainer');
const { Intent, IntentExample, Story, StoryStep, Rule, RuleStep, DomainResponse, DomainIntent, SessionConfig, ResponseTemplate } = require('../models');
/* DOMAIN CONFIGURATION CRUD OPERATIONS(DATABASE BASED) */

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

module.exports = router;