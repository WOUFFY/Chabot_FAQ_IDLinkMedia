const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Rasa Bot Manager API',
            version: '1.0.0',
            description: 'API for managing Rasa chatbot training data and models',
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            },
            servers: [
                {
                    url: 'http://localhost:3000',
                    description: 'Development server'
                }
            ]
        },
        components: {
            schemas: {
                Intent: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        IntentExamples: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/IntentExample'
                            }
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                IntentExample: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        text: { type: 'string' },
                        IntentId: { type: 'integer' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Story: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        StorySteps: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/StoryStep'
                            }
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                StoryStep: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        type: { type: 'string', enum: ['intent', 'action'] },
                        name: { type: 'string' },
                        StoryId: { type: 'integer' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Rule: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        RuleSteps: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/RuleStep'
                            }
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                RuleStep: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        type: { type: 'string', enum: ['intent', 'action'] },
                        name: { type: 'string' },
                        RuleId: { type: 'integer' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Config: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        recipe: { type: 'string' },
                        assistant_id: { type: 'string' },
                        language: { type: 'string' },
                        pipeline: {
                            type: 'array',
                            items: {
                                type: 'object',
                                additionalProperties: true
                            }
                        },
                        policies: {
                            type: 'array',
                            items: {
                                type: 'object',
                                additionalProperties: true
                            }
                        },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                ConfigUpdate: {
                    type: 'object',
                    required: ['recipe', 'language'],
                    properties: {
                        recipe: { type: 'string', description: 'Configuration recipe name' },
                        assistant_id: { type: 'string', description: 'Assistant unique identifier' },
                        language: { type: 'string', description: 'Language code (e.g., "id", "en")' },
                        pipeline: {
                            type: 'array',
                            description: 'NLU pipeline components',
                            items: {
                                type: 'object',
                                additionalProperties: true
                            }
                        },
                        policies: {
                            type: 'array',
                            description: 'Dialogue policies',
                            items: {
                                type: 'object',
                                additionalProperties: true
                            }
                        }
                    }
                },
                SessionConfig: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        session_expiration_time: { type: 'integer' },
                        carry_over_slots_to_new_session: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                TrainingStatus: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        model: { type: 'string' },
                        loadResult: {
                            type: 'object',
                            additionalProperties: true
                        },
                        stats: {
                            type: 'object',
                            properties: {
                                intents: { type: 'integer' },
                                domainIntents: { type: 'integer' },
                                responses: { type: 'integer' },
                                actions: { type: 'integer' },
                                slots: { type: 'integer' },
                                stories: { type: 'integer' },
                                rules: { type: 'integer' }
                            }
                        },
                        sessionConfig: {
                            $ref: '#/components/schemas/SessionConfig'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        }
    },
    apis: ['./routes/*.js'] // Path to the API routes
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = {
    swaggerUi,
    swaggerDocs
};