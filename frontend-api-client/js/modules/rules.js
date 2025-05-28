// -------- RULES --------
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
            
            <h3>Steps (Must include at least one intent and one action)</h3>
            <div id="stepsContainer">
                <div class="step-row">
                    <select name="stepType[]" class="step-type" onchange="updateRuleNameOptions(this)">
                        <option value="intent">intent</option>
                        <option value="action">action</option>
                    </select>
                    <select name="stepName[]" class="step-name" required>
                        <!-- Options will be populated dynamically -->
                    </select>
                    <button type="button" class="add-step">+</button>
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
                    <th>Steps</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;

        if (data.length === 0) {
            html += `<tr><td colspan="4" class="no-data">No rules found. Add your first rule above.</td></tr>`;
        } else {
            data.forEach(r => {
                html += `<tr data-name="${r.name.toLowerCase()}">
                    <td>${r.id}</td>
                    <td>${r.name}</td>
                    <td>${(r.RuleSteps || []).map(st => `${st.type}:${st.name}`).join('<br>')}</td>
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
                .form-group input {
                    width: 100%;
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #ced4da;
                }
                .step-row {
                    display: flex;
                    margin-bottom: 8px;
                    align-items: center;
                }
                .step-row select, .step-row input {
                    margin-right: 10px;
                }
                .step-type {
                    width: 120px;
                }
                .step-name {
                    flex: 1;
                }
                button.add-step, button.remove-step {
                    width: 30px;
                    height: 30px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-weight: bold;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button.add-step:hover {
                }
                button.remove-step {
                }
                button.remove-step:hover {
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
                    padding: 10px;
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

        // Store available intents and actions for dropdowns
        window.availableIntents = intents;
        window.availableActions = actions;

        // Initialize the first step's name options
        updateRuleNameOptions(document.querySelector('.step-type'));

        // Add event listener for the "Add Step" button
        document.querySelector('.add-step').addEventListener('click', function () {
            const newStep = document.createElement('div');
            newStep.className = 'step-row';
            newStep.innerHTML = `
                <select name="stepType[]" class="step-type" onchange="updateRuleNameOptions(this)">
                    <option value="intent">intent</option>
                    <option value="action">action</option>
                </select>
                <select name="stepName[]" class="step-name" required>
                    <!-- Options will be populated dynamically -->
                </select>
                <button type="button" class="remove-step">-</button>
            `;
            document.getElementById('stepsContainer').appendChild(newStep);

            // Initialize the new step's name options
            updateRuleNameOptions(newStep.querySelector('.step-type'));

            // Add event listener for the remove button
            newStep.querySelector('.remove-step').addEventListener('click', function () {
                this.parentElement.remove();
            });
        });

        document.getElementById('ruleForm').onsubmit = async e => {
            e.preventDefault();
            const fd = new FormData(e.target);

            const types = fd.getAll('stepType[]');
            const names = fd.getAll('stepName[]');

            // Create steps array
            const steps = types.map((type, index) => ({
                type: type,
                name: names[index]
            })).filter(s => s.type && s.name);

            // Validate that there is at least one intent and one action
            const hasIntent = steps.some(step => step.type === 'intent');
            const hasAction = steps.some(step => step.type === 'action');

            const validationMessage = document.getElementById('rule-validation-message');
            validationMessage.style.display = 'none';

            if (!hasIntent && !hasAction) {
                validationMessage.textContent = 'Error: Rule must include at least one intent and one action step';
                validationMessage.style.display = 'block';
                return;
            } else if (!hasIntent) {
                validationMessage.textContent = 'Error: Rule must include at least one intent step';
                validationMessage.style.display = 'block';
                return;
            } else if (!hasAction) {
                validationMessage.textContent = 'Error: Rule must include at least one action step';
                validationMessage.style.display = 'block';
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/rules`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: fd.get('name'),
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

// Function to update name options based on type
window.updateRuleNameOptions = function (typeSelect) {
    const stepRow = typeSelect.closest('.step-row');
    const nameSelect = stepRow.querySelector('.step-name');
    const type = typeSelect.value;

    nameSelect.innerHTML = ''; // Clear existing options

    let options = [];
    if (type === 'intent') {
        options = window.availableIntents || [];
    } else if (type === 'action') {
        options = window.availableActions || [];
    }

    // Add an empty option first
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = `Select a ${type}...`;
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
            const customName = prompt(`Enter a custom ${type} name:`);
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

        // Create edit form HTML
        let html = `<h2>Edit Rule</h2>
        <form id="editRuleForm" class="add-form">
            <div class="form-group">
                <label>Rule Name:</label>
                <input name="name" value="${rule.name}" required>
            </div>
            
            <h3>Steps (Must include at least one intent and one action)</h3>
            <div id="editStepsContainer">`;

        // Add existing steps
        if (rule.RuleSteps && rule.RuleSteps.length > 0) {
            rule.RuleSteps.forEach((step, index) => {
                html += `<div class="step-row">
                    <select name="stepType[]" class="step-type" onchange="updateEditRuleNameOptions(this)">
                        <option value="intent" ${step.type === 'intent' ? 'selected' : ''}>intent</option>
                        <option value="action" ${step.type === 'action' ? 'selected' : ''}>action</option>
                    </select>
                    <select name="stepName[]" class="step-name" required>
                        <!-- Will be populated dynamically -->
                    </select>
                    ${index === 0 ?
                        `<button type="button" class="add-step">+</button>` :
                        `<button type="button" class="remove-step">-</button>`}
                </div>`;
            });
        } else {
            // Add at least one step row if no steps exist
            html += `<div class="step-row">
                <select name="stepType[]" class="step-type" onchange="updateEditRuleNameOptions(this)">
                    <option value="intent">intent</option>
                    <option value="action">action</option>
                </select>
                <select name="stepName[]" class="step-name" required>
                    <!-- Will be populated dynamically -->
                </select>
                <button type="button" class="add-step">+</button>
            </div>`;
        }

        html += `</div>
            
            <input type="hidden" name="id" value="${rule.id}">
            <button type="submit" class="primary-btn">Update Rule</button>
            <button type="button" class="cancel-btn" onclick="renderRules()">Cancel</button>
            <div id="edit-rule-validation-message" class="validation-message"></div>
        </form>`;

        document.getElementById('content').innerHTML = html;

        // Store available intents and actions for edit mode
        window.editAvailableIntents = intents;
        window.editAvailableActions = actions;

        // Function to update name options in edit mode
        window.updateEditRuleNameOptions = function (typeSelect) {
            const stepRow = typeSelect.closest('.step-row');
            const nameSelect = stepRow.querySelector('.step-name');
            const type = typeSelect.value;

            nameSelect.innerHTML = ''; // Clear existing options

            let options = [];
            if (type === 'intent') {
                options = window.editAvailableIntents || [];
            } else if (type === 'action') {
                options = window.editAvailableActions || [];
            }

            // Add available options
            options.forEach(option => {
                const optEl = document.createElement('option');
                optEl.value = option.name;
                optEl.textContent = option.name;
                nameSelect.appendChild(optEl);
            });

            // Add custom option
            const customOption = document.createElement('option');
            customOption.value = 'custom';
            customOption.textContent = '-- Enter custom name --';
            nameSelect.appendChild(customOption);

            // Initialize with a matching step from the rule
            const stepIndex = Array.from(document.querySelectorAll('.step-row')).indexOf(stepRow);
            if (rule.RuleSteps && rule.RuleSteps[stepIndex] && rule.RuleSteps[stepIndex].type === type) {
                const currentValue = rule.RuleSteps[stepIndex].name;

                // Check if the value exists in options
                const exists = Array.from(nameSelect.options).some(opt => opt.value === currentValue);

                if (!exists && currentValue) {
                    // Add the current value if it doesn't exist in options
                    const currentOpt = document.createElement('option');
                    currentOpt.value = currentValue;
                    currentOpt.textContent = `${currentValue} (current)`;
                    nameSelect.insertBefore(currentOpt, nameSelect.firstChild);
                }

                nameSelect.value = currentValue;
            }

            // Add event listener for custom option
            nameSelect.onchange = function () {
                if (this.value === 'custom') {
                    const customName = prompt(`Enter a custom ${type} name:`);
                    if (customName && customName.trim()) {
                        // Create and add a new option
                        const newOption = document.createElement('option');
                        newOption.value = customName.trim();
                        newOption.textContent = customName.trim();
                        nameSelect.insertBefore(newOption, nameSelect.lastChild);
                        nameSelect.value = customName.trim();
                    } else {
                        // Reset to first option if canceled
                        nameSelect.selectedIndex = 0;
                    }
                }
            };
        };

        // Initialize name dropdowns for each step
        document.querySelectorAll('.step-type').forEach(typeSelect => {
            updateEditRuleNameOptions(typeSelect);
        });

        // Add event listener for add step button
        document.querySelector('.add-step').addEventListener('click', function () {
            const newStep = document.createElement('div');
            newStep.className = 'step-row';
            newStep.innerHTML = `
                <select name="stepType[]" class="step-type" onchange="updateEditRuleNameOptions(this)">
                    <option value="intent">intent</option>
                    <option value="action">action</option>
                </select>
                <select name="stepName[]" class="step-name" required>
                    <!-- Will be populated dynamically -->
                </select>
                <button type="button" class="remove-step">-</button>
            `;
            document.getElementById('editStepsContainer').appendChild(newStep);

            // Initialize the new step's options
            updateEditRuleNameOptions(newStep.querySelector('.step-type'));

            // Add event listener for remove button
            newStep.querySelector('.remove-step').addEventListener('click', function () {
                this.parentElement.remove();
            });
        });

        // Add event listeners for all remove buttons
        document.querySelectorAll('.remove-step').forEach(button => {
            button.addEventListener('click', function () {
                this.parentElement.remove();
            });
        });

        // Handle form submission
        document.getElementById('editRuleForm').onsubmit = async e => {
            e.preventDefault();
            const fd = new FormData(e.target);

            const types = fd.getAll('stepType[]');
            const names = fd.getAll('stepName[]');

            // Create steps array
            const steps = types.map((type, index) => ({
                type: type,
                name: names[index]
            })).filter(s => s.type && s.name);

            // Validate steps
            const hasIntent = steps.some(step => step.type === 'intent');
            const hasAction = steps.some(step => step.type === 'action');

            const validationMessage = document.getElementById('edit-rule-validation-message');
            validationMessage.style.display = 'none';

            if (!hasIntent && !hasAction) {
                validationMessage.textContent = 'Error: Rule must include at least one intent and one action step';
                validationMessage.style.display = 'block';
                return;
            } else if (!hasIntent) {
                validationMessage.textContent = 'Error: Rule must include at least one intent step';
                validationMessage.style.display = 'block';
                return;
            } else if (!hasAction) {
                validationMessage.textContent = 'Error: Rule must include at least one action step';
                validationMessage.style.display = 'block';
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/rules/${fd.get('id')}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: fd.get('name'),
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