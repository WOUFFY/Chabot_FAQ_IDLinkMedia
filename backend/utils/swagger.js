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