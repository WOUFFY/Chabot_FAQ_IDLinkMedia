// -------- RULE STEPS --------
async function renderRuleSteps() {
    try {
        // Fetch both rule steps and rules for the dropdown
        const [stepsRes, rulesRes, intentsRes, actionsRes] = await Promise.all([
            fetch(`${API_BASE}/rule-steps`),
            fetch(`${API_BASE}/rules`),
            fetch(`${API_BASE}/domain-db/intents`),
            fetch(`${API_BASE}/domain-db/responses`) // Actions correspond to responses in RASA
        ]);

        if (!stepsRes.ok || !rulesRes.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await stepsRes.json();
        const rules = await rulesRes.json();
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

        // Create a mapping of rule IDs to names
        const ruleMap = {};
        rules.forEach(rule => {
            ruleMap[rule.id] = rule.name;
        });

        let html = `<h2>Rule Steps</h2>
        <form id="ruleStepForm" class="add-form">
            <div class="form-group">
                <label>Rule:</label>
                <select name="RuleId" id="ruleSelect" required>
                    <option value="">Select a rule</option>
                    ${rules.map(rule => `<option value="${rule.id}">${rule.name}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Step Type:</label>
                <select name="type" id="typeSelect" onchange="updateNameOptions(this.value)">
                    <option value="intent">intent</option>
                    <option value="action">action</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Name:</label>
                <select name="name" id="nameSelect" required>
                    <!-- Options will be populated dynamically based on type selection -->
                </select>
            </div>
            
            <div class="form-group">
                <label>Order:</label>
                <input name="order" placeholder="Leave blank for auto" type="number" min="0">
                <span id="next-order" class="hint">Auto order will be calculated when rule is selected</span>
            </div>
            
            <button type="submit" class="primary-btn">Add Step</button>
            <div id="validation-message" class="validation-message"></div>
        </form>
        
        <div class="filter-container">
            <select id="filterRuleSelect" onchange="filterRuleSteps()">
                <option value="">Filter by rule...</option>
                ${rules.map(rule => `<option value="${rule.id}">${rule.name}</option>`).join('')}
            </select>
            <input type="text" id="filterText" placeholder="Filter steps by name..." oninput="filterRuleSteps()">
            <button class="clear-filter" onclick="clearRuleStepFilter()">Clear Filter</button>
        </div>
        
        <h3>Existing Rule Steps</h3>
        <table id="ruleStepsTable">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Rule</th>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Order</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;

        // Group steps by rule for better readability
        const groupedSteps = {};

        data.forEach(step => {
            if (!groupedSteps[step.RuleId]) {
                groupedSteps[step.RuleId] = [];
            }
            groupedSteps[step.RuleId].push(step);
        });

        // Sort by rule name and then by step order
        Object.keys(groupedSteps).forEach(ruleId => {
            const ruleName = ruleMap[ruleId] || `Rule ID: ${ruleId}`;

            // Add a rule header row
            html += `<tr class="rule-header" data-rule-id="${ruleId}">
                <td colspan="6">${ruleName}</td>
            </tr>`;

            // Sort steps by order
            const sortedSteps = groupedSteps[ruleId].sort((a, b) => {
                return (a.order || 0) - (b.order || 0);
            });

            // Add step rows
            sortedSteps.forEach(step => {
                html += `<tr data-rule-id="${step.RuleId}" data-name="${step.name.toLowerCase()}">
                    <td>${step.id}</td>
                    <td>${ruleMap[step.RuleId] || step.RuleId}</td>
                    <td>${step.type}</td>
                    <td>${step.name}</td>
                    <td>${step.order !== null && step.order !== undefined ? step.order : 'Auto'}</td>
                    <td>
                        <button class="action edit" onclick="editRuleStep(${step.id})">Edit</button>
                        <button class="action delete" onclick="deleteRuleStep(${step.id})">Delete</button>
                    </td>
                </tr>`;
            });
        });

        if (data.length === 0) {
            html += `<tr><td colspan="6" class="no-data">No rule steps found. Add your first step above.</td></tr>`;
        }

        html += `</tbody></table>`;
        document.getElementById('content').innerHTML = html;

        // Add styles for better appearance
        document.head.insertAdjacentHTML('beforeend', `
            <style>
                .form-group {
                    margin-bottom: 15px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                .hint {
                    display: block;
                    font-size: 12px;
                    color: #666;
                    margin-top: 3px;
                }
                .rule-header {
                    background-color: #e9ecef;
                    font-weight: bold;
                }
                .rule-header td {
                    padding: 8px;
                    text-align: left;
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
                /* For better dropdown appearance */
                select {
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #ced4da;
                    width: 100%;
                    max-width: 300px;
                }
                .add-form {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    border: 1px solid #ddd;
                }
                .step-tag {
                    display: inline-block;
                    margin: 2px;
                    padding: 3px 6px;
                    border-radius: 3px;
                    font-size: 12px;
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
                    flex-grow: 1;
                    max-width: none;
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

        // Add event listener to auto-calculate next order when a rule is selected
        document.getElementById('ruleSelect').addEventListener('change', function () {
            const ruleId = this.value;
            if (!ruleId) {
                document.getElementById('next-order').textContent = 'Auto order will be calculated when rule is selected';
                return;
            }

            // Find the highest order for this rule
            const ruleSteps = groupedSteps[ruleId] || [];
            let nextOrder = 0;

            if (ruleSteps.length > 0) {
                const maxOrder = Math.max(...ruleSteps.map(step => step.order || 0));
                nextOrder = maxOrder + 1;
            }

            document.getElementById('next-order').textContent = `Auto order will be: ${nextOrder}`;

            // Check if rule has both intent and action
            validateRuleRequirements(ruleId, groupedSteps);
        });

        // Create global variables to store intents and actions for the dropdown
        window.availableIntents = intents;
        window.availableActions = actions;

        // Initial call will be handled when form is rendered

        document.getElementById('ruleStepForm').onsubmit = async e => {
            e.preventDefault();
            const fd = new FormData(e.target);

            const ruleId = fd.get('RuleId');
            const type = fd.get('type');
            const name = fd.get('name');
            const order = fd.get('order') ? Number(fd.get('order')) : undefined;

            if (!ruleId || !type || !name) {
                showValidationError('Please fill out all required fields');
                return;
            }

            // Check if the rule already has the required types after this addition
            const ruleSteps = groupedSteps[ruleId] || [];
            const currentSteps = [...ruleSteps]; // Create a copy

            // Add the new step to the array for validation
            currentSteps.push({ type, name });

            const hasIntent = currentSteps.some(step => step.type === 'intent');
            const hasAction = currentSteps.some(step => step.type === 'action');

            if (!hasIntent) {
                showValidationError('This rule needs at least one intent step. Please add an intent step first.');
                return;
            }

            if (!hasAction) {
                showValidationError('This rule needs at least one action step. Please add an action step first.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/rule-steps`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type,
                        name,
                        order,
                        RuleId: Number(ruleId)
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to add rule step');
                }

                renderRuleSteps();
            } catch (error) {
                showValidationError(`Error: ${error.message}`);
            }
        };

        // Add filter functionality
        window.filterRuleSteps = function () {
            const filterRuleId = document.getElementById('filterRuleSelect').value;
            const filterText = document.getElementById('filterText').value.toLowerCase();
            const rows = document.querySelectorAll('#ruleStepsTable tbody tr');

            rows.forEach(row => {
                // For rule header rows, only filter by rule ID
                if (row.classList.contains('rule-header')) {
                    const ruleId = row.getAttribute('data-rule-id');
                    row.style.display = !filterRuleId || ruleId === filterRuleId ? '' : 'none';
                    return;
                }

                const ruleId = row.getAttribute('data-rule-id');
                const name = row.getAttribute('data-name');

                const ruleMatch = !filterRuleId || ruleId === filterRuleId;
                const textMatch = !filterText || (name && name.includes(filterText));

                row.style.display = ruleMatch && textMatch ? '' : 'none';
            });
        };

        window.clearRuleStepFilter = function () {
            document.getElementById('filterRuleSelect').value = '';
            document.getElementById('filterText').value = '';
            document.querySelectorAll('#ruleStepsTable tbody tr').forEach(row => {
                row.style.display = '';
            });
        };
    } catch (error) {
        document.getElementById('content').innerHTML = `
            <div class="error-message">
                An error occurred: ${error.message}
                <button onclick="renderRuleSteps()">Retry</button>
            </div>
        `;
    }

    // Add the function for updating name options based on type
    // Initialize the UI based on the current type
    if (document.getElementById('typeSelect')) {
        updateNameOptions('intent');
    }
}

// Define function globally so it can be accessed from HTML
window.updateNameOptions = function (value) {
    const nameSelect = document.getElementById('nameSelect');
    nameSelect.innerHTML = ''; // Clear existing options

    let options = [];
    if (value === 'intent') {
        options = window.availableIntents || [];
    } else if (value === 'action') {
        options = window.availableActions || [];
    }

    // Add an empty option first
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = `Select a ${value}...`;
    nameSelect.appendChild(emptyOption);

    // Add available options
    options.forEach(option => {
        const optEl = document.createElement('option');
        optEl.value = option.name;
        optEl.textContent = option.name;
        nameSelect.appendChild(optEl);
    });

    // Add custom option at the end
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = '-- Enter custom name --';
    nameSelect.appendChild(customOption);

    // Add event listener for custom option
    nameSelect.onchange = function () {
        if (this.value === 'custom') {
            const customName = prompt(`Enter a custom ${value} name:`);
            if (customName && customName.trim()) {
                // Create and add a new option
                const newOption = document.createElement('option');
                newOption.value = customName.trim();
                newOption.textContent = customName.trim();
                nameSelect.insertBefore(newOption, nameSelect.lastChild);
                nameSelect.value = customName.trim();
            } else {
                // If canceled or empty, reset to first option
                nameSelect.selectedIndex = 0;
            }
        }
    };
}

// Function to validate rule requirements
window.validateRuleRequirements = function (ruleId, groupedSteps) {
    const ruleSteps = groupedSteps[ruleId] || [];
    const hasIntent = ruleSteps.some(step => step.type === 'intent');
    const hasAction = ruleSteps.some(step => step.type === 'action');

    const validationMessage = document.getElementById('validation-message');
    validationMessage.style.display = 'none';

    // If this is a new rule with no steps yet, show a helpful message
    if (ruleSteps.length === 0) {
        validationMessage.textContent = 'New rule: You must add at least one intent and one action step';
        validationMessage.style.display = 'block';
        return;
    }

    if (!hasIntent) {
        validationMessage.textContent = 'This rule needs at least one intent step';
        validationMessage.style.display = 'block';
        return;
    }

    if (!hasAction) {
        validationMessage.textContent = 'This rule needs at least one action step';
        validationMessage.style.display = 'block';
        return;
    }
}

// Helper function to show validation errors
window.showValidationError = function (message) {
    const validationMessage = document.getElementById('validation-message');
    validationMessage.textContent = message;
    validationMessage.style.display = 'block';

    // Hide the message after 5 seconds
    setTimeout(() => {
        validationMessage.style.display = 'none';
    }, 5000);
}

async function deleteRuleStep(id) {
    if (confirm('Are you sure you want to delete this step?')) {
        try {
            const response = await fetch(`${API_BASE}/rule-steps/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete rule step');
            }

            renderRuleSteps();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
}

// Function to edit a rule step
async function editRuleStep(id) {
    try {
        const [stepRes, rulesRes, intentsRes, actionsRes] = await Promise.all([
            fetch(`${API_BASE}/rule-steps/${id}`),
            fetch(`${API_BASE}/rules`),
            fetch(`${API_BASE}/domain-db/intents`),
            fetch(`${API_BASE}/domain-db/responses`)
        ]);

        if (!stepRes.ok || !rulesRes.ok) {
            throw new Error('Failed to fetch data for editing');
        }

        const step = await stepRes.json();
        const rules = await rulesRes.json();
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
        }

        let html = `<h2>Edit Rule Step</h2>
        <form id="editStepForm" class="add-form">
            <div class="form-group">
                <label>Rule:</label>
                <select name="RuleId" required>
                    ${rules.map(rule =>
            `<option value="${rule.id}" ${rule.id === step.RuleId ? 'selected' : ''}>${rule.name}</option>`
        ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Type:</label>
                <select name="type" id="editTypeSelect" onchange="updateEditNameOptions(this.value)">
                    <option value="intent" ${step.type === 'intent' ? 'selected' : ''}>intent</option>
                    <option value="action" ${step.type === 'action' ? 'selected' : ''}>action</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Name:</label>
                <select name="name" id="editNameSelect" required>
                    <!-- Options will be populated dynamically -->
                </select>
            </div>
            
            <div class="form-group">
                <label>Order:</label>
                <input name="order" type="number" min="0" value="${step.order !== null ? step.order : ''}">
            </div>
            
            <input type="hidden" name="id" value="${step.id}">
            <button type="submit" class="primary-btn">Update Step</button>
            <button type="button" class="cancel-btn" onclick="renderRuleSteps()">Cancel</button>
            <div id="edit-validation-message" class="validation-message"></div>
        </form>`;

        document.getElementById('content').innerHTML = html;

        // Create local variables for edit mode
        window.editIntents = intents;
        window.editActions = actions;

        // Define the updateEditNameOptions function
        window.updateEditNameOptions = function (type) {
            const nameSelect = document.getElementById('editNameSelect');
            nameSelect.innerHTML = ''; // Clear existing options

            let options = [];
            if (type === 'intent') {
                options = window.editIntents || [];
            } else if (type === 'action') {
                options = window.editActions || [];
            }

            // Add options from the fetched data
            options.forEach(option => {
                const optEl = document.createElement('option');
                optEl.value = option.name;
                optEl.textContent = option.name;
                nameSelect.appendChild(optEl);
            });

            // Add an option for the current value if it's not in the list
            const currentValue = step.name;
            const valueExists = options.some(option => option.name === currentValue);

            if (!valueExists && currentValue) {
                // Add the current value if it doesn't exist in options
                const currentOption = document.createElement('option');
                currentOption.value = currentValue;
                currentOption.textContent = `${currentValue} (current)`;
                nameSelect.insertBefore(currentOption, nameSelect.firstChild);
            }

            // Add custom option at the end
            const customOption = document.createElement('option');
            customOption.value = 'custom';
            customOption.textContent = '-- Enter custom name --';
            nameSelect.appendChild(customOption);

            // Select the current value
            nameSelect.value = currentValue;

            // Add event listener for custom option
            nameSelect.onchange = function () {
                if (this.value === 'custom') {
                    const customName = prompt(`Enter a custom ${type} name:`, currentValue);
                    if (customName && customName.trim()) {
                        // Create and add a new option
                        const newOption = document.createElement('option');
                        newOption.value = customName.trim();
                        newOption.textContent = customName.trim();
                        nameSelect.insertBefore(newOption, nameSelect.lastChild);
                        nameSelect.value = customName.trim();
                    } else {
                        // If canceled or empty, reset to current value
                        nameSelect.value = currentValue;
                    }
                }
            };
        }

        // Initialize the name dropdown with the current type
        updateEditNameOptions(step.type);

        document.getElementById('editStepForm').onsubmit = async e => {
            e.preventDefault();
            const fd = new FormData(e.target);

            const ruleId = fd.get('RuleId');
            const type = fd.get('type');
            const name = fd.get('name');
            const order = fd.get('order') ? Number(fd.get('order')) : undefined;

            if (!ruleId || !type || !name) {
                const validationMessage = document.getElementById('edit-validation-message');
                validationMessage.textContent = 'Please fill out all required fields';
                validationMessage.style.display = 'block';
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/rule-steps/${fd.get('id')}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type,
                        name,
                        order,
                        RuleId: Number(ruleId)
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update rule step');
                }

                renderRuleSteps();
            } catch (error) {
                const validationMessage = document.getElementById('edit-validation-message');
                validationMessage.textContent = `Error: ${error.message}`;
                validationMessage.style.display = 'block';
            }
        };
    } catch (error) {
        alert(`Error: ${error.message}`);
        renderRuleSteps();
    }
}