// sebgai entry point untuk aplikasi Node.js yang mengelola bot Rasa dan menyediakan API untuk interaksi dengan bot tersebut.

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const { swaggerUi, swaggerDocs } = require('./utils/swagger');
const db = require('./models');

// Import routes
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev')); // HTTP request logger
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// API Routes
app.use('/api', routes);

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Rasa Bot Manager API' });
});

// 404 Not Found handler
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found - The requested resource does not exist' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: err.message || 'Something went wrong!',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Database sync & server start (port bebas)
const PORT = process.env.PORT || 3000;

// Sync database models if needed
// Use {force: true} only in development to drop and recreate tables
db.sequelize.sync({ force: false })
    .then(() => {
        console.log('Database synchronized');

        // Start server after DB sync
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}.`);
            console.log(`Swagger API docs available at: http://localhost:${PORT}/api-docs`);
        });
    })
    .catch(err => {
        console.error('Failed to sync database:', err);
    });

// For testing or programmatic use
module.exports = app;