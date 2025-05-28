### Project Structure
```
/chatbot-frontend
│
├── index.html
├── styles.css
└── script.js
```

### 1. `index.html`
This file contains the structure of the web page, including forms for interacting with the APIs.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chatbot API Interface</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Chatbot API Interface</h1>

    <section>
        <h2>Train Model</h2>
        <button id="trainModelBtn">Train Model</button>
        <p id="trainModelResponse"></p>
    </section>

    <section>
        <h2>Intents</h2>
        <button id="getIntentsBtn">Get All Intents</button>
        <ul id="intentsList"></ul>

        <h3>Create Intent</h3>
        <input type="text" id="intentName" placeholder="Intent Name">
        <textarea id="intentExamples" placeholder="Examples (comma separated)"></textarea>
        <button id="createIntentBtn">Create Intent</button>
        <p id="createIntentResponse"></p>
    </section>

    <script src="script.js"></script>
</body>
</html>
```

### 2. `styles.css`
This file contains basic styles for the web page.

```css
body {
    font-family: Arial, sans-serif;
    margin: 20px;
    padding: 20px;
    background-color: #f4f4f4;
}

h1 {
    color: #333;
}

section {
    margin-bottom: 20px;
    padding: 10px;
    background: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

button {
    padding: 10px 15px;
    margin-top: 10px;
    cursor: pointer;
}

input, textarea {
    width: 100%;
    padding: 10px;
    margin-top: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
}
```

### 3. `script.js`
This file contains the JavaScript code to handle API interactions.

```javascript
const apiBaseUrl = 'http://localhost:3000/api'; // Adjust the base URL as needed

// Function to train the model
document.getElementById('trainModelBtn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${apiBaseUrl}/train`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        document.getElementById('trainModelResponse').innerText = data.message || 'Training failed';
    } catch (error) {
        document.getElementById('trainModelResponse').innerText = 'Error: ' + error.message;
    }
});

// Function to get all intents
document.getElementById('getIntentsBtn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${apiBaseUrl}/intents`);
        const intents = await response.json();
        const intentsList = document.getElementById('intentsList');
        intentsList.innerHTML = ''; // Clear previous list
        intents.forEach(intent => {
            const li = document.createElement('li');
            li.innerText = intent.name;
            intentsList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching intents:', error);
    }
});

// Function to create a new intent
document.getElementById('createIntentBtn').addEventListener('click', async () => {
    const name = document.getElementById('intentName').value;
    const examples = document.getElementById('intentExamples').value.split(',').map(example => example.trim());

    if (!name) {
        alert('Intent name is required');
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/intents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, examples }),
        });
        const data = await response.json();
        document.getElementById('createIntentResponse').innerText = data.message || 'Intent created successfully';
    } catch (error) {
        document.getElementById('createIntentResponse').innerText = 'Error: ' + error.message;
    }
});
```

### Instructions to Run the Project
1. **Set up your backend**: Ensure that your backend server (the one with the `train.js` file) is running and accessible at the specified `apiBaseUrl`.
2. **Create the project files**: Create the project structure as shown above and copy the respective code into each file.
3. **Open the HTML file**: Open `index.html` in a web browser to interact with the APIs.

### Notes
- This is a basic implementation and can be expanded with more features, such as error handling, loading indicators, and additional API interactions.
- Ensure that CORS is enabled on your backend if you are accessing it from a different origin.
- Adjust the `apiBaseUrl` in `script.js` to match your backend server's URL.