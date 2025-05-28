// -------- DOMAIN --------
async function renderDomain() {
    let html = `
        <h2>Domain Configuration</h2>
        <div class="tab-buttons">
            <button onclick="renderDomainTab('intents')" class="tab-btn">Intents</button>
            <button onclick="renderDomainTab('responses')" class="tab-btn">Responses</button>
            <button onclick="renderDomainTab('session')" class="tab-btn">Session Config</button>
            <button onclick="renderDomainTab('complete')" class="tab-btn">Complete Domain</button>
        </div>
        <div id="domain-container"></div>
    `;
    document.getElementById('content').innerHTML = html;

    // Add styles for tabs and buttons
    document.head.insertAdjacentHTML('beforeend', `
        <style>
            .tab-buttons {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                border-bottom: 1px solid #dee2e6;
                padding-bottom: 10px;
            }
            .tab-btn {
                background-color: #f8f9fa;
                border: 1px solid #ddd;
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
            }
            .tab-btn:hover {
                background-color: #e9ecef;
            }
            .tab-btn.active {
                background-color: #007bff;
                color: white;
                border-color: #007bff;
            }
            .action.edit {
                background-color: #17a2b8;
                color: white;
                border: none;
                padding: 6px 10px;
                border-radius: 4px;
                cursor: pointer;
                margin-right: 5px;
            }
            .action.edit:hover {
                background-color: #138496;
            }
            .action.delete {
                background-color: #dc3545;
                color: white;
                border: none;
                padding: 6px 10px;
                border-radius: 4px;
                cursor: pointer;
            }
            .action.delete:hover {
                background-color: #c82333;
            }
            .action.view {
                background-color: #28a745;
                color: white;
                border: none;
                padding: 6px 10px;
                border-radius: 4px;
                cursor: pointer;
                margin-right: 5px;
            }
            .action.view:hover {
                background-color: #218838;
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
            .template, .template-view {
                background-color: #f8f9fa;
                padding: 15px;
                margin-bottom: 15px;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            .domain-section {
                margin-bottom: 20px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 5px;
                border: 1px solid #ddd;
            }
        </style>
    `);

    renderDomainTab('intents'); // Default to intents view
}

async function renderDomainTab(tab) {
    document.getElementById('domain-container').innerHTML = 'Loading...';

    // Update active tab styling
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Find the button for this tab and make it active
    const currentTabBtn = Array.from(document.querySelectorAll('.tab-btn')).find(
        btn => btn.getAttribute('onclick').includes(tab)
    );
    if (currentTabBtn) currentTabBtn.classList.add('active');

    switch (tab) {
        case 'intents': renderDomainIntents(); break;
        case 'responses': renderDomainResponses(); break;
        case 'session': renderSessionConfig(); break;
        case 'complete': renderCompleteDomain(); break;
    }
}

// Domain Intents
async function renderDomainIntents() {
    try {
        const res = await fetch(`${API_BASE}/domain-db/intents`);
        const data = await res.json();

        let html = `
            <h3>Domain Intents</h3>
            <form id="domainIntentForm" class="add-form">
                <input name="name" placeholder="Intent name" required>
                <button type="submit" class="primary-btn">Add Intent</button>
            </form>
            
            <div class="filter-container">
                <input type="text" id="intentFilterText" placeholder="Filter intents by name..." oninput="filterIntents()">
                <button class="clear-filter" onclick="clearIntentFilter()">Clear Filter</button>
            </div>
            
            <table id="intentsTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (data.length === 0) {
            html += `<tr><td colspan="3" class="no-data">No intents found. Add your first intent above.</td></tr>`;
        } else {
            data.forEach(intent => {
                html += `
                    <tr data-name="${intent.name.toLowerCase()}">
                        <td>${intent.id}</td>
                        <td>${intent.name}</td>
                        <td>
                            <button class="action edit" onclick="editDomainIntent(${intent.id}, '${intent.name}')">Edit</button>
                            <button class="action delete" onclick="deleteDomainIntent(${intent.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
        }

        html += `
                </tbody>
            </table>
        `;
        document.getElementById('domain-container').innerHTML = html;

        document.getElementById('domainIntentForm').onsubmit = async e => {
            e.preventDefault();
            const fd = new FormData(e.target);
            await fetch(`${API_BASE}/domain-db/intents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: fd.get('name') })
            });
            renderDomainIntents();
        };

        // Add filter functionality
        window.filterIntents = function () {
            const filterText = document.getElementById('intentFilterText').value.toLowerCase();
            const rows = document.querySelectorAll('#intentsTable tbody tr');

            rows.forEach(row => {
                const name = row.getAttribute('data-name');
                if (name) {
                    row.style.display = name.includes(filterText) ? '' : 'none';
                }
            });
        };

        window.clearIntentFilter = function () {
            document.getElementById('intentFilterText').value = '';
            document.querySelectorAll('#intentsTable tbody tr').forEach(row => {
                row.style.display = '';
            });
        };
    } catch (err) {
        document.getElementById('domain-container').innerHTML = `Error: ${err.message}`;
    }
}

async function editDomainIntent(id, name) {
    const newName = prompt('Enter new intent name:', name);
    if (newName && newName !== name) {
        await fetch(`${API_BASE}/domain-db/intents/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        });
        renderDomainIntents();
    }
}

async function deleteDomainIntent(id) {
    if (confirm('Delete this domain intent?')) {
        await fetch(`${API_BASE}/domain-db/intents/${id}`, { method: 'DELETE' });
        renderDomainIntents();
    }
}

// Domain Responses
async function renderDomainResponses() {
    try {
        const res = await fetch(`${API_BASE}/domain-db/responses`);
        const data = await res.json();

        let html = `
            <h3>Domain Responses</h3>
            <button onclick="showAddResponseForm()" class="primary-btn">Add Response</button>
            <div id="responseFormContainer" style="display:none;"></div>
            
            <div class="filter-container">
                <input type="text" id="responseFilterText" placeholder="Filter responses by name..." oninput="filterResponses()">
                <button class="clear-filter" onclick="clearResponseFilter()">Clear Filter</button>
            </div>
            
            <table id="responsesTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Templates</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (data.length === 0) {
            html += `<tr><td colspan="4" class="no-data">No responses found. Add your first response above.</td></tr>`;
        } else {
            data.forEach(response => {
                const templateCount = response.ResponseTemplates ? response.ResponseTemplates.length : 0;
                html += `
                    <tr data-name="${response.name.toLowerCase()}">
                        <td>${response.id}</td>
                        <td>${response.name}</td>
                        <td>${templateCount} template(s)</td>
                        <td>
                            <button class="action view" onclick="viewDomainResponse(${response.id})">View</button>
                            <button class="action edit" onclick="editDomainResponse(${response.id})">Edit</button>
                            <button class="action delete" onclick="deleteDomainResponse(${response.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
        }

        html += `
                </tbody>
            </table>
        `;
        document.getElementById('domain-container').innerHTML = html;

        // Add filter functionality
        window.filterResponses = function () {
            const filterText = document.getElementById('responseFilterText').value.toLowerCase();
            const rows = document.querySelectorAll('#responsesTable tbody tr');

            rows.forEach(row => {
                const name = row.getAttribute('data-name');
                if (name) {
                    row.style.display = name.includes(filterText) ? '' : 'none';
                }
            });
        };

        window.clearResponseFilter = function () {
            document.getElementById('responseFilterText').value = '';
            document.querySelectorAll('#responsesTable tbody tr').forEach(row => {
                row.style.display = '';
            });
        };
    } catch (err) {
        document.getElementById('domain-container').innerHTML = `Error: ${err.message}`;
    }
}

function showAddResponseForm() {
    let html = `
        <h4>Add New Response</h4>
        <form id="addResponseForm" class="add-form">
            <div class="form-group">
                <label>Name: </label>
                <input name="name" placeholder="e.g., utter_greet" required>
            </div>
            <div id="templates">
                <div class="template">
                    <h4>Template 1</h4>
                    <div class="form-group">
                        <label>Text: </label>
                        <textarea name="text[]" rows="2" cols="40"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Buttons (JSON): </label>
                        <textarea name="buttons[]" rows="2" cols="40" placeholder='[{"title":"Button", "payload":"/intent"}]'></textarea>
                    </div>
                    <div class="form-group">
                        <label>Image URL: </label>
                        <input name="image[]" type="text">
                    </div>
                </div>
            </div>
            <button type="button" class="primary-btn" onclick="addTemplateField()">Add Template</button>
            <div style="margin-top: 15px;">
                <button type="submit" class="primary-btn">Save</button>
                <button type="button" class="clear-filter" onclick="cancelResponseForm()">Cancel</button>
            </div>
        </form>
    `;
    document.getElementById('responseFormContainer').innerHTML = html;
    document.getElementById('responseFormContainer').style.display = 'block';

    document.getElementById('addResponseForm').onsubmit = async e => {
        e.preventDefault();
        const fd = new FormData(e.target);

        const name = fd.get('name');
        const texts = fd.getAll('text[]');
        const buttonsList = fd.getAll('buttons[]');
        const images = fd.getAll('image[]');

        const templates = [];
        for (let i = 0; i < texts.length; i++) {
            const template = {};
            if (texts[i]) template.text = texts[i];

            if (buttonsList[i]) {
                try {
                    template.buttons = JSON.parse(buttonsList[i]);
                } catch (e) {
                    alert('Invalid JSON in buttons field');
                    return;
                }
            }

            if (images[i]) template.image = images[i];

            templates.push(template);
        }

        await fetch(`${API_BASE}/domain-db/responses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, templates })
        });

        renderDomainResponses();
    };
}

let templateCounter = 1;

function addTemplateField() {
    templateCounter++;
    const templateDiv = document.createElement('div');
    templateDiv.className = 'template';
    templateDiv.innerHTML = `
        <h4>Template ${templateCounter}</h4>
        <div class="form-group">
            <label>Text: </label>
            <textarea name="text[]" rows="2" cols="40"></textarea>
        </div>
        <div class="form-group">
            <label>Buttons (JSON): </label>
            <textarea name="buttons[]" rows="2" cols="40" placeholder='[{"title":"Button", "payload":"/intent"}]'></textarea>
        </div>
        <div class="form-group">
            <label>Image URL: </label>
            <input name="image[]" type="text">
        </div>
        <button type="button" class="action delete" onclick="removeTemplate(this)">Remove Template</button>
    `;
    document.getElementById('templates').appendChild(templateDiv);
}

function removeTemplate(button) {
    button.parentElement.remove();
}

function cancelResponseForm() {
    document.getElementById('responseFormContainer').style.display = 'none';
    templateCounter = 1;
}

async function viewDomainResponse(id) {
    try {
        const res = await fetch(`${API_BASE}/domain-db/responses/${id}`);
        const response = await res.json();

        let templatesHtml = '';
        if (response.ResponseTemplates && response.ResponseTemplates.length > 0) {
            response.ResponseTemplates.forEach((template, i) => {
                templatesHtml += `
                    <div class="template-view">
                        <h4>Template ${i + 1}</h4>
                        ${template.text ? `<p><strong>Text:</strong> ${template.text}</p>` : ''}
                        ${template.buttons ? `<p><strong>Buttons:</strong> <pre>${JSON.stringify(template.buttons, null, 2)}</pre></p>` : ''}
                        ${template.image ? `<p><strong>Image:</strong> <a href="${template.image}" target="_blank">${template.image}</a></p>` : ''}
                    </div>
                `;
            });
        } else {
            templatesHtml = '<p>No templates found</p>';
        }

        const html = `
            <h3>Response: ${response.name}</h3>
            <div class="response-details">
                ${templatesHtml}
            </div>
            <button class="primary-btn" onclick="renderDomainResponses()">Back</button>
        `;

        document.getElementById('domain-container').innerHTML = html;
    } catch (err) {
        document.getElementById('domain-container').innerHTML = `Error: ${err.message}`;
    }
}

async function editDomainResponse(id) {
    try {
        const res = await fetch(`${API_BASE}/domain-db/responses/${id}`);
        const response = await res.json();

        let html = `
            <h3>Edit Response: ${response.name}</h3>
            <form id="editResponseForm" class="add-form">
                <div class="form-group">
                    <label>Name: </label>
                    <input name="name" value="${response.name}" required>
                </div>
                <div id="edit-templates">`;

        if (response.ResponseTemplates && response.ResponseTemplates.length > 0) {
            response.ResponseTemplates.forEach((template, i) => {
                html += `
                    <div class="template">
                        <h4>Template ${i + 1}</h4>
                        <div class="form-group">
                            <label>Text: </label>
                            <textarea name="text[]" rows="2" cols="40">${template.text || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Buttons (JSON): </label>
                            <textarea name="buttons[]" rows="2" cols="40">${template.buttons ? JSON.stringify(template.buttons) : ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Image URL: </label>
                            <input name="image[]" type="text" value="${template.image || ''}">
                        </div>
                        ${i > 0 ? `<button type="button" class="action delete" onclick="removeEditTemplate(this)">Remove</button>` : ''}
                    </div>
                `;
            });
        } else {
            html += `
                <div class="template">
                    <h4>Template 1</h4>
                    <div class="form-group">
                        <label>Text: </label>
                        <textarea name="text[]" rows="2" cols="40"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Buttons (JSON): </label>
                        <textarea name="buttons[]" rows="2" cols="40"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Image URL: </label>
                        <input name="image[]" type="text">
                    </div>
                </div>
            `;
        }

        html += `
                </div>
                <button type="button" class="primary-btn" onclick="addEditTemplateField()">Add Template</button>
                <div style="margin-top: 15px;">
                    <button type="submit" class="primary-btn">Update</button>
                    <button type="button" class="clear-filter" onclick="renderDomainResponses()">Cancel</button>
                </div>
                <input type="hidden" name="responseId" value="${id}">
            </form>
        `;

        document.getElementById('domain-container').innerHTML = html;

        document.getElementById('editResponseForm').onsubmit = async e => {
            e.preventDefault();
            const fd = new FormData(e.target);

            const name = fd.get('name');
            const responseId = fd.get('responseId');
            const texts = fd.getAll('text[]');
            const buttonsList = fd.getAll('buttons[]');
            const images = fd.getAll('image[]');

            const templates = [];
            for (let i = 0; i < texts.length; i++) {
                const template = {};
                if (texts[i]) template.text = texts[i];

                if (buttonsList[i]) {
                    try {
                        template.buttons = JSON.parse(buttonsList[i]);
                    } catch (e) {
                        alert('Invalid JSON in buttons field');
                        return;
                    }
                }

                if (images[i]) template.image = images[i];

                templates.push(template);
            }

            await fetch(`${API_BASE}/domain-db/responses/${responseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, templates })
            });

            renderDomainResponses();
        };
    } catch (err) {
        document.getElementById('domain-container').innerHTML = `Error: ${err.message}`;
    }
}

function addEditTemplateField() {
    const templateDiv = document.createElement('div');
    templateDiv.className = 'template';
    templateDiv.innerHTML = `
        <h4>New Template</h4>
        <div class="form-group">
            <label>Text: </label>
            <textarea name="text[]" rows="2" cols="40"></textarea>
        </div>
        <div class="form-group">
            <label>Buttons (JSON): </label>
            <textarea name="buttons[]" rows="2" cols="40"></textarea>
        </div>
        <div class="form-group">
            <label>Image URL: </label>
            <input name="image[]" type="text">
        </div>
        <button type="button" class="action delete" onclick="removeEditTemplate(this)">Remove</button>
    `;
    document.getElementById('edit-templates').appendChild(templateDiv);
}

function removeEditTemplate(button) {
    button.parentElement.remove();
}

async function deleteDomainResponse(id) {
    if (confirm('Delete this response?')) {
        await fetch(`${API_BASE}/domain-db/responses/${id}`, { method: 'DELETE' });
        renderDomainResponses();
    }
}

// Session Configuration
async function renderSessionConfig() {
    try {
        const res = await fetch(`${API_BASE}/domain-db/session-config`);
        const config = await res.json();

        let html = `
            <h3>Session Configuration</h3>
            <form id="sessionConfigForm" class="add-form">
                <div class="form-group">
                    <label>Session Expiration Time (minutes): </label>
                    <input name="session_expiration_time" type="number" value="${config.session_expiration_time}" required>
                </div>
                <div class="form-group">
                    <label>Carry Over Slots to New Session: </label>
                    <select name="carry_over_slots_to_new_session">
                        <option value="true" ${config.carry_over_slots_to_new_session ? 'selected' : ''}>Yes</option>
                        <option value="false" ${!config.carry_over_slots_to_new_session ? 'selected' : ''}>No</option>
                    </select>
                </div>
                <button type="submit" class="primary-btn">Update Session Config</button>
            </form>
        `;

        document.getElementById('domain-container').innerHTML = html;

        document.getElementById('sessionConfigForm').onsubmit = async e => {
            e.preventDefault();
            const fd = new FormData(e.target);

            const sessionExpirationTime = parseInt(fd.get('session_expiration_time'));
            const carryOverSlots = fd.get('carry_over_slots_to_new_session') === 'true';

            await fetch(`${API_BASE}/domain-db/session-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_expiration_time: sessionExpirationTime,
                    carry_over_slots_to_new_session: carryOverSlots
                })
            });

            alert('Session configuration updated');
            renderSessionConfig();
        };
    } catch (err) {
        document.getElementById('domain-container').innerHTML = `Error: ${err.message}`;
    }
}

// Complete Domain
async function renderCompleteDomain() {
    try {
        const res = await fetch(`${API_BASE}/domain-db`);
        const domain = await res.json();

        let html = `
            <h3>Complete Domain</h3>
            <div class="domain-section">
                <h4>Version: ${domain.version}</h4>
            </div>
            
            <div class="domain-section">
                <h4>Intents (${domain.intents.length})</h4>
                
                <div class="filter-container">
                    <input type="text" id="completeIntentFilterText" placeholder="Filter intents..." oninput="filterCompleteIntents()">
                    <button class="clear-filter" onclick="clearCompleteIntentFilter()">Clear</button>
                </div>
                
                <ul id="completeIntentsList">
                    ${domain.intents.map(intent => `<li data-name="${intent.toLowerCase()}">${intent}</li>`).join('')}
                </ul>
            </div>
            
            <div class="domain-section">
                <h4>Responses (${Object.keys(domain.responses).length})</h4>
                
                <div class="filter-container">
                    <input type="text" id="completeResponseFilterText" placeholder="Filter responses..." oninput="filterCompleteResponses()">
                    <button class="clear-filter" onclick="clearCompleteResponseFilter()">Clear</button>
                </div>
                
                <div id="completeResponsesList">
                    ${Object.entries(domain.responses).map(([name, templates]) => `
                        <div class="response-item" data-name="${name.toLowerCase()}">
                            <h5>${name}</h5>
                            <p>${templates.length} template(s)</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="domain-section">
                <h4>Session Config</h4>
                <ul>
                    <li>Expiration Time: ${domain.session_config.session_expiration_time} minutes</li>
                    <li>Carry Over Slots: ${domain.session_config.carry_over_slots_to_new_session ? 'Yes' : 'No'}</li>
                </ul>
            </div>
        `;

        document.getElementById('domain-container').innerHTML = html;

        // Add filter functionality for complete domain page
        window.filterCompleteIntents = function () {
            const filterText = document.getElementById('completeIntentFilterText').value.toLowerCase();
            const items = document.querySelectorAll('#completeIntentsList li');

            items.forEach(item => {
                const name = item.getAttribute('data-name');
                if (name) {
                    item.style.display = name.includes(filterText) ? '' : 'none';
                }
            });
        };

        window.clearCompleteIntentFilter = function () {
            document.getElementById('completeIntentFilterText').value = '';
            document.querySelectorAll('#completeIntentsList li').forEach(item => {
                item.style.display = '';
            });
        };

        window.filterCompleteResponses = function () {
            const filterText = document.getElementById('completeResponseFilterText').value.toLowerCase();
            const items = document.querySelectorAll('#completeResponsesList .response-item');

            items.forEach(item => {
                const name = item.getAttribute('data-name');
                if (name) {
                    item.style.display = name.includes(filterText) ? '' : 'none';
                }
            });
        };

        window.clearCompleteResponseFilter = function () {
            document.getElementById('completeResponseFilterText').value = '';
            document.querySelectorAll('#completeResponsesList .response-item').forEach(item => {
                item.style.display = '';
            });
        };
    } catch (err) {
        document.getElementById('domain-container').innerHTML = `Error: ${err.message}`;
    }
}