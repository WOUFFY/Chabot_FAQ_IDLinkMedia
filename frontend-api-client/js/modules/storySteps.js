// -------- STORY STEPS --------
async function renderStorySteps() {
    try {
        // Fetch both story steps and stories for the dropdown
        const [stepsRes, storiesRes, intentsRes, actionsRes] = await Promise.all([
            fetch(`${API_BASE}/story-steps`),
            fetch(`${API_BASE}/stories`),
            fetch(`${API_BASE}/domain-db/intents`),
            fetch(`${API_BASE}/domain-db/responses`) // Actions correspond to responses in RASA
        ]);

        if (!stepsRes.ok || !storiesRes.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await stepsRes.json();
        const stories = await storiesRes.json();
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

        // Create a mapping of story IDs to names
        const storyMap = {};
        stories.forEach(story => {
            storyMap[story.id] = story.name;
        });

        let html = `<h2>Story Steps</h2>
        <p class="hint-text">Story steps define the flow of conversation in your chatbot.</p>
        <form id="storyStepForm" class="add-form">
            <div class="form-group">
                <label>Story:</label>
                <select name="StoryId" id="storySelect" required>
                    <option value="">Select a story</option>
                    ${stories.map(story => `<option value="${story.id}">${story.name}</option>`).join('')}
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
                <span id="next-order" class="hint">Auto order will be calculated when story is selected</span>
            </div>
            
            <button type="submit" class="primary-btn">Add Step</button>
            <div id="validation-message" class="validation-message"></div>
        </form>
        
        <div class="filter-container">
            <select id="filterStorySelect" onchange="filterStorySteps()">
                <option value="">Filter by story...</option>
                ${stories.map(story => `<option value="${story.id}">${story.name}</option>`).join('')}
            </select>
            <input type="text" id="filterText" placeholder="Filter steps by name..." oninput="filterStorySteps()">
            <button class="clear-filter" onclick="clearStoryStepFilter()">Clear Filter</button>
        </div>
        
        <h3>Existing Story Steps</h3>
        <table id="storyStepsTable">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Story</th>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Order</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;

        // Group steps by story for better readability
        const groupedSteps = {};

        data.forEach(step => {
            if (!groupedSteps[step.StoryId]) {
                groupedSteps[step.StoryId] = [];
            }
            groupedSteps[step.StoryId].push(step);
        });

        // Sort by story name and then by step order
        Object.keys(groupedSteps).forEach(storyId => {
            const storyName = storyMap[storyId] || `Story ID: ${storyId}`;

            // Add a story header row
            html += `<tr class="story-header" data-story-id="${storyId}">
                <td colspan="6">${storyName}</td>
            </tr>`;

            // Sort steps by order
            const sortedSteps = groupedSteps[storyId].sort((a, b) => {
                return (a.order || 0) - (b.order || 0);
            });

            // Add step rows
            sortedSteps.forEach(step => {
                html += `<tr data-story-id="${step.StoryId}" data-name="${step.name.toLowerCase()}">
                    <td>${step.id}</td>
                    <td>${storyMap[step.StoryId] || step.StoryId}</td>
                    <td>${step.type}</td>
                    <td>${step.name}</td>
                    <td>${step.order !== null && step.order !== undefined ? step.order : 'Auto'}</td>
                    <td>
                        <button class="action edit" onclick="editStoryStep(${step.id})">Edit</button>
                        <button class="action delete" onclick="deleteStoryStep(${step.id})">Delete</button>
                    </td>
                </tr>`;
            });
        });

        if (data.length === 0) {
            html += `<tr><td colspan="6" class="no-data">No story steps found. Add your first step above.</td></tr>`;
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
                .hint {
                    display: block;
                    font-size: 12px;
                    color: #666;
                    margin-top: 3px;
                }
                .story-header {
                    background-color: #e9ecef;
                    font-weight: bold;
                }
                .story-header td {
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

        // Add event listener to auto-calculate next order when a story is selected
        document.getElementById('storySelect').addEventListener('change', function () {
            const storyId = this.value;
            if (!storyId) {
                document.getElementById('next-order').textContent = 'Auto order will be calculated when story is selected';
                return;
            }

            // Find the highest order for this story
            const storySteps = groupedSteps[storyId] || [];
            let nextOrder = 0;

            if (storySteps.length > 0) {
                const maxOrder = Math.max(...storySteps.map(step => step.order || 0));
                nextOrder = maxOrder + 1;
            }

            document.getElementById('next-order').textContent = `Auto order will be: ${nextOrder}`;

            // Check if story has both intent and action
            validateStoryRequirements(storyId, groupedSteps);
        });

        // Create global variables to store intents and actions for the dropdown
        window.availableIntents = intents;
        window.availableActions = actions;

        // Initial call will be handled when form is rendered
        if (document.getElementById('typeSelect')) {
            updateNameOptions('intent');
        }

        document.getElementById('storyStepForm').onsubmit = async e => {
            e.preventDefault();
            const fd = new FormData(e.target);

            const storyId = fd.get('StoryId');
            const type = fd.get('type');
            const name = fd.get('name');
            const order = fd.get('order') ? Number(fd.get('order')) : undefined;

            if (!storyId || !type || !name) {
                showValidationError('Please fill out all required fields');
                return;
            }

            // Check if the story already has the required types after this addition
            const storySteps = groupedSteps[storyId] || [];
            const currentSteps = [...storySteps]; // Create a copy

            // Add the new step to the array for validation
            currentSteps.push({ type, name });

            const hasIntent = currentSteps.some(step => step.type === 'intent');
            const hasAction = currentSteps.some(step => step.type === 'action');

            if (!hasIntent) {
                showValidationError('This story needs at least one intent step. Please add an intent step first.');
                return;
            }

            if (!hasAction) {
                showValidationError('This story needs at least one action step. Please add an action step first.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/story-steps`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type,
                        name,
                        order,
                        StoryId: Number(storyId)
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to add story step');
                }

                renderStorySteps();
            } catch (error) {
                showValidationError(`Error: ${error.message}`);
            }
        };

        // Add filter functionality
        window.filterStorySteps = function () {
            const filterStoryId = document.getElementById('filterStorySelect').value;
            const filterText = document.getElementById('filterText').value.toLowerCase();
            const rows = document.querySelectorAll('#storyStepsTable tbody tr');

            rows.forEach(row => {
                // For story header rows, only filter by story ID
                if (row.classList.contains('story-header')) {
                    const storyId = row.getAttribute('data-story-id');
                    row.style.display = !filterStoryId || storyId === filterStoryId ? '' : 'none';
                    return;
                }

                const storyId = row.getAttribute('data-story-id');
                const name = row.getAttribute('data-name');

                const storyMatch = !filterStoryId || storyId === filterStoryId;
                const textMatch = !filterText || (name && name.includes(filterText));

                row.style.display = storyMatch && textMatch ? '' : 'none';
            });
        };

        window.clearStoryStepFilter = function () {
            document.getElementById('filterStorySelect').value = '';
            document.getElementById('filterText').value = '';
            document.querySelectorAll('#storyStepsTable tbody tr').forEach(row => {
                row.style.display = '';
            });
        };

    } catch (error) {
        document.getElementById('content').innerHTML = `
            <div class="error-message">
                An error occurred: ${error.message}
                <button onclick="renderStorySteps()">Retry</button>
            </div>
        `;
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

// Function to validate story requirements
window.validateStoryRequirements = function (storyId, groupedSteps) {
    const storySteps = groupedSteps[storyId] || [];
    const hasIntent = storySteps.some(step => step.type === 'intent');
    const hasAction = storySteps.some(step => step.type === 'action');

    const validationMessage = document.getElementById('validation-message');
    validationMessage.style.display = 'none';

    // If this is a new story with no steps yet, show a helpful message
    if (storySteps.length === 0) {
        validationMessage.textContent = 'New story: You must add at least one intent and one action step';
        validationMessage.style.display = 'block';
        return;
    }

    if (!hasIntent) {
        validationMessage.textContent = 'This story needs at least one intent step';
        validationMessage.style.display = 'block';
        return;
    }

    if (!hasAction) {
        validationMessage.textContent = 'This story needs at least one action step';
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

async function deleteStoryStep(id) {
    if (confirm('Are you sure you want to delete this step?')) {
        try {
            const response = await fetch(`${API_BASE}/story-steps/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete story step');
            }

            renderStorySteps();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
}

// Function to edit a story step
async function editStoryStep(id) {
    try {
        const [stepRes, storiesRes, intentsRes, actionsRes] = await Promise.all([
            fetch(`${API_BASE}/story-steps/${id}`),
            fetch(`${API_BASE}/stories`),
            fetch(`${API_BASE}/domain-db/intents`),
            fetch(`${API_BASE}/domain-db/responses`)
        ]);

        if (!stepRes.ok || !storiesRes.ok) {
            throw new Error('Failed to fetch data for editing');
        }

        const step = await stepRes.json();
        const stories = await storiesRes.json();
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

        let html = `<h2>Edit Story Step</h2>
        <form id="editStepForm" class="add-form">
            <div class="form-group">
                <label>Story:</label>
                <select name="StoryId" required>
                    ${stories.map(story =>
            `<option value="${story.id}" ${story.id === step.StoryId ? 'selected' : ''}>${story.name}</option>`
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
            <button type="button" class="cancel-btn" onclick="renderStorySteps()">Cancel</button>
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

            const storyId = fd.get('StoryId');
            const type = fd.get('type');
            const name = fd.get('name');
            const order = fd.get('order') ? Number(fd.get('order')) : undefined;

            if (!storyId || !type || !name) {
                const validationMessage = document.getElementById('edit-validation-message');
                validationMessage.textContent = 'Please fill out all required fields';
                validationMessage.style.display = 'block';
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/story-steps/${fd.get('id')}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type,
                        name,
                        order,
                        StoryId: Number(storyId)
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update story step');
                }

                renderStorySteps();
            } catch (error) {
                const validationMessage = document.getElementById('edit-validation-message');
                validationMessage.textContent = `Error: ${error.message}`;
                validationMessage.style.display = 'block';
            }
        };
    } catch (error) {
        alert(`Error: ${error.message}`);
        renderStorySteps();
    }
}