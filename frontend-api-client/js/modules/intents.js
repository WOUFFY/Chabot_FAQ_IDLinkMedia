// -------- INTENTS --------
async function renderIntents() {
    try {
        const res = await fetch(`${API_BASE}/intents`);

        if (!res.ok) {
            throw new Error(`Failed to fetch intents: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        let html = `<h2>Intents</h2>
        <p class="description">Intents represent what users want to do with your chatbot. Add examples to help the AI recognize user intentions.</p>
        <form id="intentForm" class="add-form">
            <div class="form-group">
                <label for="intentName">Intent Name:</label>
                <input id="intentName" name="name" placeholder="Intent name (e.g. greet, goodbye)" required>
            </div>
            <div class="form-group">
                <label for="intentExamples">Examples:</label>
                <textarea id="intentExamples" name="examples" placeholder="Examples (comma separated, e.g. hello, hi there, greetings)" rows="3"></textarea>
                <span class="hint">Enter comma-separated phrases that represent this intent</span>
            </div>
            <button type="submit" class="primary-btn">Add Intent</button>
            <div id="message" class="message"></div>
        </form>
        
        <h3>Existing Intents</h3>
        <table>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Examples</th>
                <th>Actions</th>
            </tr>`;

        if (data.length === 0) {
            html += `<tr><td colspan="4" class="no-data">No intents found. Add your first intent above.</td></tr>`;
        } else {
            data.forEach(i => {
                html += `<tr>
                    <td>${i.id}</td>
                    <td>${i.name}</td>
                    <td>
                        <ul class="examples-list">
                            ${(i.IntentExamples || []).map(e =>
                    `<li>
                                    ${e.text}
                                    <button class="mini-action delete-example" 
                                        onclick="deleteIntentExample(${e.id})" 
                                        title="Delete example">✕</button>
                                </li>`
                ).join('')}
                        </ul>
                        <button class="add-example-btn" onclick="addExample(${i.id})">+ Add Example</button>
                    </td>
                    <td>
                        <button class="action edit" onclick="editIntent(${i.id})">Edit</button>
                        <button class="action delete" onclick="deleteIntent(${i.id})">Delete</button>
                    </td>
                </tr>`;
            });
        }

        html += `</table>`;

        document.getElementById('content').innerHTML = html;

        // Add styles for the examples list and buttons
        document.head.insertAdjacentHTML('beforeend', `
            <style>
                .description {
                    color: #6c757d;
                    margin-bottom: 20px;
                }
                .add-form {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 5px;
                    margin-bottom: 30px;
                    border: 1px solid #ddd;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                .form-group input, .form-group textarea {
                    width: 100%;
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #ced4da;
                }
                .hint {
                    display: block;
                    font-size: 12px;
                    color: #6c757d;
                    margin-top: 5px;
                }
                .message {
                    margin-top: 10px;
                    padding: 8px;
                    border-radius: 4px;
                    display: none;
                }
                .success {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .error {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                .primary-btn {
                    background-color: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .primary-btn:hover {
                    background-color: #0069d9;
                }
                .edit {
                    background-color: #17a2b8;
                }
                .edit:hover {
                    background-color: #138496;
                }
                .delete {
                    background-color: #dc3545;
                }
                .delete:hover {
                    background-color: #c82333;
                }
                .examples-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .examples-list li {
                    margin-bottom: 5px;
                    padding: 5px;
                    background-color: #f8f9fa;
                    border-radius: 3px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .mini-action {
                    border: none;
                    background: none;
                    color: #dc3545;
                    cursor: pointer;
                    font-weight: bold;
                    padding: 0 5px;
                }
                .mini-action:hover {
                    color: #c82333;
                }
                .add-example-btn {
                    border: none;
                    background: none;
                    color: #28a745;
                    cursor: pointer;
                    padding: 5px 0;
                    font-size: 0.9em;
                }
                .add-example-btn:hover {
                    text-decoration: underline;
                }
                .no-data {
                    text-align: center;
                    padding: 20px;
                    color: #6c757d;
                    font-style: italic;
                }
            </style>
        `);

        document.getElementById('intentForm').onsubmit = async e => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const messageEl = document.getElementById('message');

            try {
                const response = await fetch(`${API_BASE}/intents`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: fd.get('name'),
                        examples: fd.get('examples') ? fd.get('examples').split(',').map(s => s.trim()).filter(s => s) : []
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to create intent');
                }

                // Show success message
                messageEl.textContent = 'Intent created successfully!';
                messageEl.className = 'message success';
                messageEl.style.display = 'block';

                // Clear form
                e.target.reset();

                // Hide message after 3 seconds
                setTimeout(() => {
                    messageEl.style.display = 'none';
                }, 3000);

                // Refresh the list
                renderIntents();
            } catch (error) {
                messageEl.textContent = `Error: ${error.message}`;
                messageEl.className = 'message error';
                messageEl.style.display = 'block';

                // Hide error message after 5 seconds
                setTimeout(() => {
                    messageEl.style.display = 'none';
                }, 5000);
            }
        };
    } catch (error) {
        document.getElementById('content').innerHTML = `
            <div class="error-container">
                <h2>Error</h2>
                <p>${error.message}</p>
                <button onclick="renderIntents()">Try Again</button>
            </div>
        `;
    }
}

// Add a new example to an existing intent
async function addExample(intentId) {
    const example = prompt('Enter the example text:');
    if (!example || !example.trim()) return;

    try {
        const response = await fetch(`${API_BASE}/intent-examples`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: example.trim(),
                IntentId: intentId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add example');
        }

        renderIntents(); // Refresh to show the new example
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Delete a specific intent example
async function deleteIntentExample(exampleId) {
    if (!confirm('Are you sure you want to delete this example?')) return;

    try {
        const response = await fetch(`${API_BASE}/intent-examples/${exampleId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete example');
        }

        renderIntents(); // Refresh to show the updated list
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function deleteIntent(id) {
    if (confirm('Are you sure you want to delete this intent? This will also delete all associated examples.')) {
        try {
            const response = await fetch(`${API_BASE}/intents/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete intent');
            }

            renderIntents();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
}

async function editIntent(id) {
    try {
        // Fetch intent details
        const response = await fetch(`${API_BASE}/intents/${id}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch intent');
        }

        const intent = await response.json();

        // Create edit form
        let html = `
            <h2>Edit Intent</h2>
            <form id="editIntentForm" class="add-form">
                <div class="form-group">
                    <label for="editIntentName">Intent Name:</label>
                    <input id="editIntentName" name="name" value="${intent.name}" required>
                </div>
                <input type="hidden" name="id" value="${intent.id}">
                <button type="submit" class="primary-btn">Update Intent</button>
                <button type="button" class="cancel-btn" onclick="renderIntents()">Cancel</button>
                <div id="edit-message" class="message"></div>
            </form>
            
            <div class="examples-section">
                <h3>Examples</h3>
                <div class="examples-container">
                    <ul id="examples-list" class="examples-list">
                        ${(intent.IntentExamples || []).map(e =>
            `<li>
                                <span class="example-text">${e.text}</span>
                                <div class="example-actions">
                                    <button class="mini-action edit-example" onclick="editExample(${e.id})">Edit</button>
                                    <button class="mini-action delete-example" onclick="deleteIntentExample(${e.id})">Delete</button>
                                </div>
                            </li>`
        ).join('')}
                    </ul>
                    <div class="add-example-container">
                        <input type="text" id="new-example" placeholder="New example text">
                        <button class="add-btn" onclick="addExampleFromEdit(${intent.id})">Add</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('content').innerHTML = html;

        // Additional styles for the edit screen
        document.head.insertAdjacentHTML('beforeend', `
            <style>
                .cancel-btn {
                    background-color: #6c757d;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    margin-left: 10px;
                    cursor: pointer;
                }
                .cancel-btn:hover {
                    background-color: #5a6268;
                }
                .examples-section {
                    margin-top: 20px;
                    padding: 20px;
                    background-color: #f8f9fa;
                    border-radius: 5px;
                    border: 1px solid #ddd;
                }
                .examples-container {
                    margin-top: 10px;
                }
                .example-actions {
                    display: flex;
                    gap: 5px;
                }
                .add-example-container {
                    display: flex;
                    margin-top: 15px;
                }
                .add-example-container input {
                    flex-grow: 1;
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #ced4da;
                    margin-right: 10px;
                }
                .add-btn {
                    background-color: #28a745;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .add-btn:hover {
                    background-color: #218838;
                }
                .examples-list li {
                    padding: 8px;
                    margin-bottom: 8px;
                }
                .example-text {
                    flex-grow: 1;
                }
            </style>
        `);

        // Handle form submission - now only updates the intent name
        document.getElementById('editIntentForm').onsubmit = async e => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const messageEl = document.getElementById('edit-message');

            try {
                const response = await fetch(`${API_BASE}/intents/${fd.get('id')}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: fd.get('name')
                        // No examples here, they're managed separately
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update intent');
                }

                // Show success message
                messageEl.textContent = 'Intent name updated successfully!';
                messageEl.className = 'message success';
                messageEl.style.display = 'block';

                // Hide message after 3 seconds but don't redirect
                setTimeout(() => {
                    messageEl.style.display = 'none';
                }, 3000);
            } catch (error) {
                messageEl.textContent = `Error: ${error.message}`;
                messageEl.className = 'message error';
                messageEl.style.display = 'block';

                // Hide error message after 5 seconds
                setTimeout(() => {
                    messageEl.style.display = 'none';
                }, 5000);
            }
        };
    } catch (error) {
        alert(`Error: ${error.message}`);
        renderIntents();
    }
}

// Add an example from the edit screen
async function addExampleFromEdit(intentId) {
    const newExampleInput = document.getElementById('new-example');
    const example = newExampleInput.value.trim();

    if (!example) {
        alert('Please enter example text');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/intent-examples`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: example,
                IntentId: intentId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add example');
        }

        // Clear the input field
        newExampleInput.value = '';

        // Refresh the current edit page to show the new example
        editIntent(intentId);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Edit a specific example
async function editExample(exampleId) {
    try {
        // Fetch the current example
        const response = await fetch(`${API_BASE}/intent-examples/${exampleId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch example');
        }

        const example = await response.json();

        // Prompt for the new text
        const newText = prompt('Edit example:', example.text);
        if (!newText || newText.trim() === example.text) return;

        // Update the example
        const updateResponse = await fetch(`${API_BASE}/intent-examples/${exampleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: newText.trim()
            })
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(errorData.error || 'Failed to update example');
        }

        // Refresh the current edit page
        editIntent(example.IntentId);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}