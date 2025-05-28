// -------- INTENT EXAMPLES --------
async function renderIntentExamples() {
    try {
        // First, fetch all intents to populate the dropdown
        const intentsRes = await fetch(`${API_BASE}/intents`);
        if (!intentsRes.ok) {
            throw new Error('Failed to fetch intents');
        }
        const intents = await intentsRes.json();

        // Then fetch the examples
        const res = await fetch(`${API_BASE}/intent-examples`);
        if (!res.ok) {
            throw new Error('Failed to fetch examples');
        }
        const data = await res.json();

        let html = `<h2>Intent Examples</h2>
        <p class="description">Examples help your chatbot understand different ways users might express the same intent.</p>
        
        <form id="intentExampleForm" class="add-form">
            <div class="form-group">
                <label for="exampleText">Example Text:</label>
                <input id="exampleText" name="text" placeholder="Example text (e.g. How do I reset my password?)" required>
            </div>
            <div class="form-group">
                <label for="intentSelect">Intent:</label>
                <select id="intentSelect" name="IntentId" required>
                    <option value="">Select Intent</option>
                    ${intents.map(intent => `<option value="${intent.id}">${intent.name}</option>`).join('')}
                </select>
            </div>
            <button type="submit" class="primary-btn">Add Example</button>
            <div id="message" class="message"></div>
        </form>
        
        <div class="filter-container">
            <input type="text" id="filterText" placeholder="Filter examples..." oninput="filterExamples()">
            <select id="filterIntent" onchange="filterExamples()">
                <option value="">All Intents</option>
                ${intents.map(intent => `<option value="${intent.id}">${intent.name}</option>`).join('')}
            </select>
            <button class="clear-filter" onclick="clearFilter()">Clear Filter</button>
        </div>
        
        <h3>Existing Examples</h3>
        <table id="examplesTable">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Text</th>
                    <th>Intent</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;

        // Create a map of intent IDs to names for displaying intent names
        const intentMap = {};
        intents.forEach(intent => intentMap[intent.id] = intent.name);

        if (data.length === 0) {
            html += `<tr><td colspan="4" class="no-data">No examples found. Add your first example above.</td></tr>`;
        } else {
            data.forEach(e => {
                html += `<tr data-intent="${e.IntentId}" data-text="${e.text.toLowerCase()}">
                    <td>${e.id}</td>
                    <td>${e.text}</td>
                    <td>${intentMap[e.IntentId] || 'Unknown'}</td>
                    <td>
                        <button class="action edit" onclick="editIntentExample(${e.id})">Edit</button>
                        <button class="action delete" onclick="deleteIntentExample(${e.id})">Delete</button>
                    </td>
                </tr>`;
            });
        }
        html += `</tbody></table>`;

        document.getElementById('content').innerHTML = html;

        // Add styles for better appearance
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
                .form-group input, .form-group select {
                    width: 100%;
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #ced4da;
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
                .no-data {
                    text-align: center;
                    padding: 20px;
                    color: #6c757d;
                    font-style: italic;
                }
                .filter-container {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                    align-items: center;
                }
                .filter-container input, .filter-container select {
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #ced4da;
                }
                .filter-container input {
                    flex-grow: 1;
                }
                .clear-filter {
                    background-color: #6c757d;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .clear-filter:hover {
                    background-color: #5a6268;
                }
            </style>
        `);

        document.getElementById('intentExampleForm').onsubmit = async e => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const messageEl = document.getElementById('message');
            const text = fd.get('text').trim();
            const intentId = Number(fd.get('IntentId'));

            if (!text || !intentId) {
                messageEl.textContent = 'Please fill in all required fields';
                messageEl.className = 'message error';
                messageEl.style.display = 'block';
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/intent-examples`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: text.startsWith('-') ? text : `- ${text}`,
                        IntentId: intentId
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to add example');
                }

                // Show success message
                messageEl.textContent = 'Example added successfully!';
                messageEl.className = 'message success';
                messageEl.style.display = 'block';

                // Clear form
                e.target.reset();

                // Hide message after 3 seconds
                setTimeout(() => {
                    messageEl.style.display = 'none';
                }, 3000);

                renderIntentExamples();
            } catch (error) {
                messageEl.textContent = `Error: ${error.message}`;
                messageEl.className = 'message error';
                messageEl.style.display = 'block';

                setTimeout(() => {
                    messageEl.style.display = 'none';
                }, 5000);
            }
        };

        // Add filter functionality
        window.filterExamples = function () {
            const filterText = document.getElementById('filterText').value.toLowerCase();
            const filterIntent = document.getElementById('filterIntent').value;
            const rows = document.querySelectorAll('#examplesTable tbody tr');

            rows.forEach(row => {
                const text = row.getAttribute('data-text');
                const intent = row.getAttribute('data-intent');
                const textMatch = !filterText || text.includes(filterText);
                const intentMatch = !filterIntent || intent === filterIntent;

                row.style.display = textMatch && intentMatch ? '' : 'none';
            });
        };

        window.clearFilter = function () {
            document.getElementById('filterText').value = '';
            document.getElementById('filterIntent').value = '';
            document.querySelectorAll('#examplesTable tbody tr').forEach(row => {
                row.style.display = '';
            });
        };

    } catch (error) {
        document.getElementById('content').innerHTML = `
            <div class="error-container">
                <h2>Error</h2>
                <p>${error.message}</p>
                <button onclick="renderIntentExamples()">Try Again</button>
            </div>
        `;
    }
}

async function deleteIntentExample(id) {
    if (confirm('Are you sure you want to delete this example?')) {
        try {
            const response = await fetch(`${API_BASE}/intent-examples/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete example');
            }

            renderIntentExamples();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
}

async function editIntentExample(id) {
    try {
        // Fetch example details
        const exampleRes = await fetch(`${API_BASE}/intent-examples/${id}`);
        const intentsRes = await fetch(`${API_BASE}/intents`);

        if (!exampleRes.ok || !intentsRes.ok) {
            throw new Error('Failed to fetch data');
        }

        const example = await exampleRes.json();
        const intents = await intentsRes.json();

        // Create edit form
        let html = `
            <h2>Edit Intent Example</h2>
            <form id="editExampleForm" class="add-form">
                <div class="form-group">
                    <label for="editExampleText">Example Text:</label>
                    <input id="editExampleText" name="text" value="${example.text}" required>
                </div>
                <div class="form-group">
                    <label for="editIntentSelect">Intent:</label>
                    <select id="editIntentSelect" name="IntentId" required>
                        ${intents.map(intent =>
            `<option value="${intent.id}" ${intent.id === example.IntentId ? 'selected' : ''}>
                                ${intent.name}
                             </option>`
        ).join('')}
                    </select>
                </div>
                <input type="hidden" name="id" value="${example.id}">
                <button type="submit" class="primary-btn">Update Example</button>
                <button type="button" class="cancel-btn" onclick="renderIntentExamples()">Cancel</button>
                <div id="edit-message" class="message"></div>
            </form>
        `;

        document.getElementById('content').innerHTML = html;

        // Add style for cancel button
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
            </style>
        `);

        // Handle form submission
        document.getElementById('editExampleForm').onsubmit = async e => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const messageEl = document.getElementById('edit-message');
            const text = fd.get('text').trim();
            const intentId = Number(fd.get('IntentId'));

            if (!text || !intentId) {
                messageEl.textContent = 'Please fill in all required fields';
                messageEl.className = 'message error';
                messageEl.style.display = 'block';
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/intent-examples/${fd.get('id')}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: text.startsWith('-') ? text : `- ${text}`,
                        IntentId: intentId
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update example');
                }

                // Show success message
                messageEl.textContent = 'Example updated successfully!';
                messageEl.className = 'message success';
                messageEl.style.display = 'block';

                // Return to main view after a delay
                setTimeout(() => {
                    renderIntentExamples();
                }, 1500);
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
        renderIntentExamples();
    }
}