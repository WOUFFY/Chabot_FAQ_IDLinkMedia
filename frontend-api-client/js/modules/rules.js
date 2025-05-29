async function renderRules() {
    try {
        // Fetch data for rules and available intents/actions
        const [rulesRes, intentsRes, actionsRes] = await Promise.all([
            fetch(`${API_BASE}/rules`),
            fetch(`${API_BASE}/domain-db/intents`),
            fetch(`${API_BASE}/domain-db/responses`) // Actions correspond to responses in RASA
        ]);

        if (!rulesRes.ok) {
            throw new Error('Failed to fetch rules');
        }

        const data = await rulesRes.json();
        let intents = [];
        let actions = [];

        try {
            intents = await intentsRes.json();
            // For actions, we use responses and clean up names to match RASA format
            const responses = await actionsRes.json();
            actions = responses.map(response => ({
                id: response.id,
                name: response.name
            }));
        } catch (error) {
            console.error("Error fetching intents or actions:", error);
            // Continue with empty arrays if there's an error
        }

        let html = `<h2>Rules</h2>
        <p class="hint-text">Rules define specific conversation patterns with conditions and responses.</p>
        <form id="ruleForm" class="add-form">
            <div class="form-group">
                <label>Rule Name:</label>
                <input name="name" placeholder="Rule name" required>
            </div>
            
            <h3>Steps</h3>
            <div id="stepsContainer">
                <div class="form-group">
                    <label>Intent (Trigger):</label>
                    <select name="intentName" id="intentSelect" class="full-width" required>
                        <option value="">-- Select an intent --</option>
                        ${intents.map(intent => `<option value="${intent.name}">${intent.name}</option>`).join('')}
                        <option value="custom">-- Enter custom intent --</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Action (Response):</label>
                    <select name="actionName" id="actionSelect" class="full-width" required>
                        <option value="">-- Select an action --</option>
                        ${actions.map(action => `<option value="${action.name}">${action.name}</option>`).join('')}
                        <option value="custom">-- Enter custom action --</option>
                    </select>
                </div>
            </div>
            
            <button type="submit" class="primary-btn">Add Rule</button>
            <div id="rule-validation-message" class="validation-message"></div>
        </form>
        
        <div class="filter-container">
            <input type="text" id="filterText" placeholder="Filter rules by name..." oninput="filterRules()">
            <button class="clear-filter" onclick="clearRuleFilter()">Clear Filter</button>
        </div>
        
        <h3>Existing Rules</h3>
        <table id="rulesTable">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Intent</th>
                    <th>Action</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;

        if (data.length === 0) {
            html += `<tr><td colspan="5" class="no-data">No rules found. Add your first rule above.</td></tr>`;
        } else {
            data.forEach(r => {
                const steps = r.RuleSteps || [];
                const intentStep = steps.find(s => s.type === 'intent') || {};
                const actionStep = steps.find(s => s.type === 'action') || {};

                html += `<tr data-name="${r.name.toLowerCase()}">
                    <td>${r.id}</td>
                    <td>${r.name}</td>
                    <td>${intentStep.name || 'N/A'}</td>
                    <td>${actionStep.name || 'N/A'}</td>
                    <td>
                        <button class="action edit" onclick="editRule(${r.id})">Edit</button>
                        <button class="action delete" onclick="deleteRule(${r.id})">Delete</button>
                    </td>
                </tr>`;
            });
        }
        html += `</tbody></table>`;
        document.getElementById('content').innerHTML = html;

        // Add styles for better appearance
        document.head.insertAdjacentHTML('beforeend', `
            <style>
                .hint-text {
                    margin-bottom: 15px;
                    color: #6c757d;
                    font-style: italic;
                }
                .add-form {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 5px;
                    margin-bottom: 20px;
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
                .full-width {
                    width: 100%;
                }
                .step-tag {
                    display: inline-block;
                    margin: 2px;
                    padding: 3px 8px;
                    border-radius: 3px;
                    font-size: 13px;
                }
                .step-tag.intent {
                    background-color: #e2f0d9;
                    color: #2e7d32;
                    border: 1px solid #a5d6a7;
                }
                .step-tag.action {
                    background-color: #e3f2fd;
                    color: #1565c0;
                    border: 1px solid #90caf9;
                }
                .validation-message {
                    margin-top: 10px;
                    padding: 8px;
                    border-radius: 4px;
                    color: #721c24;
                    background-color: #f8d7da;
                    border: 1px solid #f5c6cb;
                    display: none;
                }
                #stepsContainer {
                    margin-bottom: 15px;
                    padding: 15px;
                    border: 1px solid #eee;
                    background-color: #fafafa;
                    border-radius: 4px;
                }
                .filter-container {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                    align-items: center;
                }
                .filter-container input {
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #ced4da;
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
                .edit {
                    background-color: #17a2b8;
                    color: white;
                    border: none;
                    padding: 6px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-right: 5px;
                }
                .edit:hover {
                    background-color: #138496;
                }
                .delete {
                    background-color: #dc3545;
                    color: white;
                    border: none;
                    padding: 6px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .delete:hover {
                    background-color: #c82333;
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
                .no-data {
                    text-align: center;
                    padding: 20px;
                    color: #6c757d;
                    font-style: italic;
                }
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

        // Handle custom intent selection
        document.getElementById('intentSelect').addEventListener('change', function () {
            if (this.value === 'custom') {
                const customIntent = prompt('Enter a custom intent name:');
                if (customIntent && customIntent.trim()) {
                    // Create and add a new option
                    const newOption = document.createElement('option');
                    newOption.value = customIntent.trim();
                    newOption.textContent = customIntent.trim();
                    this.insertBefore(newOption, this.querySelector('option[value="custom"]'));
                    this.value = customIntent.trim();
                } else {
                    // If canceled or empty, reset to first option
                    this.selectedIndex = 0;
                }
            }
        });

        // Handle custom action selection
        document.getElementById('actionSelect').addEventListener('change', function () {
            if (this.value === 'custom') {
                const customAction = prompt('Enter a custom action name:');
                if (customAction && customAction.trim()) {
                    // Create and add a new option
                    const newOption = document.createElement('option');
                    newOption.value = customAction.trim();
                    newOption.textContent = customAction.trim();
                    this.insertBefore(newOption, this.querySelector('option[value="custom"]'));
                    this.value = customAction.trim();
                } else {
                    // If canceled or empty, reset to first option
                    this.selectedIndex = 0;
                }
            }
        });

        // Handle form submission
        document.getElementById('ruleForm').onsubmit = async e => {
            e.preventDefault();
            const fd = new FormData(e.target);

            // Get form values
            const ruleName = fd.get('name');
            const intentName = fd.get('intentName');
            const actionName = fd.get('actionName');

            // Validate inputs
            const validationMessage = document.getElementById('rule-validation-message');
            validationMessage.style.display = 'none';

            if (!intentName || !actionName) {
                validationMessage.textContent = 'Error: Please select both an intent and an action';
                validationMessage.style.display = 'block';
                return;
            }

            // Create steps array with intent always first, then action
            const steps = [
                { type: 'intent', name: intentName },
                { type: 'action', name: actionName }
            ];

            try {
                const response = await fetch(`${API_BASE}/rules`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: ruleName,
                        steps
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to add rule');
                }

                renderRules();
            } catch (error) {
                validationMessage.textContent = `Error: ${error.message}`;
                validationMessage.style.display = 'block';
            }
        };

        // Add filter functionality
        window.filterRules = function () {
            const filterText = document.getElementById('filterText').value.toLowerCase();
            const rows = document.querySelectorAll('#rulesTable tbody tr');

            rows.forEach(row => {
                const name = row.getAttribute('data-name');
                row.style.display = !filterText || name.includes(filterText) ? '' : 'none';
            });
        };

        window.clearRuleFilter = function () {
            document.getElementById('filterText').value = '';
            document.querySelectorAll('#rulesTable tbody tr').forEach(row => {
                row.style.display = '';
            });
        };
    } catch (error) {
        document.getElementById('content').innerHTML = `
            <div class="error-message">
                An error occurred: ${error.message}
                <button onclick="renderRules()">Retry</button>
            </div>
        `;
    }
}

async function deleteRule(id) {
    if (confirm('Are you sure you want to delete this rule?')) {
        try {
            const response = await fetch(`${API_BASE}/rules/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete rule');
            }

            renderRules();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
}

async function editRule(id) {
    try {
        // Fetch rule details
        const [ruleRes, intentsRes, actionsRes] = await Promise.all([
            fetch(`${API_BASE}/rules/${id}`),
            fetch(`${API_BASE}/domain-db/intents`),
            fetch(`${API_BASE}/domain-db/responses`)
        ]);

        if (!ruleRes.ok) {
            throw new Error('Failed to fetch rule data');
        }

        const rule = await ruleRes.json();
        let intents = [];
        let actions = [];

        try {
            intents = await intentsRes.json();
            const responses = await actionsRes.json();
            actions = responses.map(response => ({
                id: response.id,
                name: response.name
            }));
        } catch (error) {
            console.error("Error fetching intents or actions:", error);
        }

        const steps = rule.RuleSteps || [];
        const intentStep = steps.find(s => s.type === 'intent') || { name: '' };
        const actionStep = steps.find(s => s.type === 'action') || { name: '' };

        // Create edit form HTML
        let html = `<h2>Edit Rule</h2>
        <form id="editRuleForm" class="add-form">
            <div class="form-group">
                <label>Rule Name:</label>
                <input name="name" value="${rule.name}" required>
            </div>
            
            <h3>Steps</h3>
            <div id="stepsContainer">
                <div class="form-group">
                    <label>Intent (Trigger):</label>
                    <select name="intentName" id="editIntentSelect" class="full-width" required>
                        <option value="">-- Select an intent --</option>
                        ${intents.map(intent =>
            `<option value="${intent.name}" ${intentStep.name === intent.name ? 'selected' : ''}>${intent.name}</option>`
        ).join('')}
                        ${intentStep.name && !intents.some(i => i.name === intentStep.name) ?
                `<option value="${intentStep.name}" selected>${intentStep.name} (current)</option>` : ''}
                        <option value="custom">-- Enter custom intent --</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Action (Response):</label>
                    <select name="actionName" id="editActionSelect" class="full-width" required>
                        <option value="">-- Select an action --</option>
                        ${actions.map(action =>
                    `<option value="${action.name}" ${actionStep.name === action.name ? 'selected' : ''}>${action.name}</option>`
                ).join('')}
                        ${actionStep.name && !actions.some(a => a.name === actionStep.name) ?
                `<option value="${actionStep.name}" selected>${actionStep.name} (current)</option>` : ''}
                        <option value="custom">-- Enter custom action --</option>
                    </select>
                </div>
            </div>
            
            <input type="hidden" name="id" value="${rule.id}">
            <button type="submit" class="primary-btn">Update Rule</button>
            <button type="button" class="cancel-btn" onclick="renderRules()">Cancel</button>
            <div id="edit-rule-validation-message" class="validation-message"></div>
        </form>`;

        document.getElementById('content').innerHTML = html;

        // Handle custom intent selection
        document.getElementById('editIntentSelect').addEventListener('change', function () {
            if (this.value === 'custom') {
                const customIntent = prompt('Enter a custom intent name:');
                if (customIntent && customIntent.trim()) {
                    // Create and add a new option
                    const newOption = document.createElement('option');
                    newOption.value = customIntent.trim();
                    newOption.textContent = customIntent.trim();
                    this.insertBefore(newOption, this.querySelector('option[value="custom"]'));
                    this.value = customIntent.trim();
                } else {
                    // If canceled or empty, reset to previous value or first option
                    this.value = intentStep.name || '';
                    if (!this.value) this.selectedIndex = 0;
                }
            }
        });

        // Handle custom action selection
        document.getElementById('editActionSelect').addEventListener('change', function () {
            if (this.value === 'custom') {
                const customAction = prompt('Enter a custom action name:');
                if (customAction && customAction.trim()) {
                    // Create and add a new option
                    const newOption = document.createElement('option');
                    newOption.value = customAction.trim();
                    newOption.textContent = customAction.trim();
                    this.insertBefore(newOption, this.querySelector('option[value="custom"]'));
                    this.value = customAction.trim();
                } else {
                    // If canceled or empty, reset to previous value or first option
                    this.value = actionStep.name || '';
                    if (!this.value) this.selectedIndex = 0;
                }
            }
        });

        // Handle form submission
        document.getElementById('editRuleForm').onsubmit = async e => {
            e.preventDefault();
            const fd = new FormData(e.target);

            // Get form values
            const ruleName = fd.get('name');
            const intentName = fd.get('intentName');
            const actionName = fd.get('actionName');

            // Validate inputs
            const validationMessage = document.getElementById('edit-rule-validation-message');
            validationMessage.style.display = 'none';

            if (!intentName || !actionName) {
                validationMessage.textContent = 'Error: Please select both an intent and an action';
                validationMessage.style.display = 'block';
                return;
            }

            // Create steps array with intent always first, then action
            const steps = [
                { type: 'intent', name: intentName },
                { type: 'action', name: actionName }
            ];

            try {
                const response = await fetch(`${API_BASE}/rules/${fd.get('id')}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: ruleName,
                        steps
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update rule');
                }

                renderRules();
            } catch (error) {
                validationMessage.textContent = `Error: ${error.message}`;
                validationMessage.style.display = 'block';
            }
        };
    } catch (error) {
        alert(`Error: ${error.message}`);
        renderRules();
    }
}