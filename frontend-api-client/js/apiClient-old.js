const API_BASE = 'http://localhost:3000/api';

function showTab(tab) {
    document.getElementById('content').innerHTML = 'Loading...';
    switch (tab) {
        case 'intents': renderIntents(); break;
        case 'stories': renderStories(); break;
        case 'rules': renderRules(); break;
        case 'intent-examples': renderIntentExamples(); break;
        case 'story-steps': renderStorySteps(); break;
        case 'train': renderTrain(); break;
        case 'domain': renderDomain(); break;
    }
}

// Add this after the renderTrain() function and before "// Show default tab"

// -------- DOMAIN --------
async function renderDomain() {
    let html = `
        <h2>Domain Configuration</h2>
        <div class="tab-buttons">
            <button onclick="renderDomainTab('intents')">Intents</button>
            <button onclick="renderDomainTab('responses')">Responses</button>
            <button onclick="renderDomainTab('session')">Session Config</button>
            <button onclick="renderDomainTab('complete')">Complete Domain</button>
        </div>
        <div id="domain-container"></div>
    `;
    document.getElementById('content').innerHTML = html;
    renderDomainTab('intents'); // Default to intents view
}

async function renderDomainTab(tab) {
    document.getElementById('domain-container').innerHTML = 'Loading...';
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
            <form id="domainIntentForm">
                <input name="name" placeholder="Intent name" required>
                <button type="submit">Add Intent</button>
            </form>
            <table>
                <tr><th>ID</th><th>Name</th><th>Actions</th></tr>
        `;

        data.forEach(intent => {
            html += `
                <tr>
                    <td>${intent.id}</td>
                    <td>${intent.name}</td>
                    <td>
                        <button class="action" onclick="editDomainIntent(${intent.id}, '${intent.name}')">Edit</button>
                        <button class="action" onclick="deleteDomainIntent(${intent.id})">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += `</table>`;
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
            <button onclick="showAddResponseForm()">Add Response</button>
            <div id="responseFormContainer" style="display:none;"></div>
            <table>
                <tr><th>ID</th><th>Name</th><th>Templates</th><th>Actions</th></tr>
        `;

        data.forEach(response => {
            const templateCount = response.ResponseTemplates ? response.ResponseTemplates.length : 0;
            html += `
                <tr>
                    <td>${response.id}</td>
                    <td>${response.name}</td>
                    <td>${templateCount} template(s)</td>
                    <td>
                        <button class="action" onclick="viewDomainResponse(${response.id})">View</button>
                        <button class="action" onclick="editDomainResponse(${response.id})">Edit</button>
                        <button class="action" onclick="deleteDomainResponse(${response.id})">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += `</table>`;
        document.getElementById('domain-container').innerHTML = html;
    } catch (err) {
        document.getElementById('domain-container').innerHTML = `Error: ${err.message}`;
    }
}

function showAddResponseForm() {
    let html = `
        <h4>Add New Response</h4>
        <form id="addResponseForm">
            <div>
                <label>Name: </label>
                <input name="name" placeholder="e.g., utter_greet" required>
            </div>
            <div id="templates">
                <div class="template">
                    <h4>Template 1</h4>
                    <div>
                        <label>Text: </label>
                        <textarea name="text[]" rows="2" cols="40"></textarea>
                    </div>
                    <div>
                        <label>Buttons (JSON): </label>
                        <textarea name="buttons[]" rows="2" cols="40" placeholder='[{"title":"Button", "payload":"/intent"}]'></textarea>
                    </div>
                    <div>
                        <label>Image URL: </label>
                        <input name="image[]" type="text">
                    </div>
                </div>
            </div>
            <button type="button" onclick="addTemplateField()">Add Template</button>
            <div>
                <button type="submit">Save</button>
                <button type="button" onclick="cancelResponseForm()">Cancel</button>
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
        <div>
            <label>Text: </label>
            <textarea name="text[]" rows="2" cols="40"></textarea>
        </div>
        <div>
            <label>Buttons (JSON): </label>
            <textarea name="buttons[]" rows="2" cols="40" placeholder='[{"title":"Button", "payload":"/intent"}]'></textarea>
        </div>
        <div>
            <label>Image URL: </label>
            <input name="image[]" type="text">
        </div>
        <button type="button" onclick="removeTemplate(this)">Remove Template</button>
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
            <button onclick="renderDomainResponses()">Back</button>
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
            <form id="editResponseForm">
                <div>
                    <label>Name: </label>
                    <input name="name" value="${response.name}" required>
                </div>
                <div id="edit-templates">`;

        if (response.ResponseTemplates && response.ResponseTemplates.length > 0) {
            response.ResponseTemplates.forEach((template, i) => {
                html += `
                    <div class="template">
                        <h4>Template ${i + 1}</h4>
                        <div>
                            <label>Text: </label>
                            <textarea name="text[]" rows="2" cols="40">${template.text || ''}</textarea>
                        </div>
                        <div>
                            <label>Buttons (JSON): </label>
                            <textarea name="buttons[]" rows="2" cols="40">${template.buttons ? JSON.stringify(template.buttons) : ''}</textarea>
                        </div>
                        <div>
                            <label>Image URL: </label>
                            <input name="image[]" type="text" value="${template.image || ''}">
                        </div>
                        ${i > 0 ? `<button type="button" onclick="removeEditTemplate(this)">Remove</button>` : ''}
                    </div>
                `;
            });
        } else {
            html += `
                <div class="template">
                    <h4>Template 1</h4>
                    <div>
                        <label>Text: </label>
                        <textarea name="text[]" rows="2" cols="40"></textarea>
                    </div>
                    <div>
                        <label>Buttons (JSON): </label>
                        <textarea name="buttons[]" rows="2" cols="40"></textarea>
                    </div>
                    <div>
                        <label>Image URL: </label>
                        <input name="image[]" type="text">
                    </div>
                </div>
            `;
        }

        html += `
                </div>
                <button type="button" onclick="addEditTemplateField()">Add Template</button>
                <div>
                    <button type="submit">Update</button>
                    <button type="button" onclick="renderDomainResponses()">Cancel</button>
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
        <div>
            <label>Text: </label>
            <textarea name="text[]" rows="2" cols="40"></textarea>
        </div>
        <div>
            <label>Buttons (JSON): </label>
            <textarea name="buttons[]" rows="2" cols="40"></textarea>
        </div>
        <div>
            <label>Image URL: </label>
            <input name="image[]" type="text">
        </div>
        <button type="button" onclick="removeEditTemplate(this)">Remove</button>
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
            <form id="sessionConfigForm">
                <div>
                    <label>Session Expiration Time (minutes): </label>
                    <input name="session_expiration_time" type="number" value="${config.session_expiration_time}" required>
                </div>
                <div>
                    <label>Carry Over Slots to New Session: </label>
                    <select name="carry_over_slots_to_new_session">
                        <option value="true" ${config.carry_over_slots_to_new_session ? 'selected' : ''}>Yes</option>
                        <option value="false" ${!config.carry_over_slots_to_new_session ? 'selected' : ''}>No</option>
                    </select>
                </div>
                <button type="submit">Update Session Config</button>
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
                <ul>
                    ${domain.intents.map(intent => `<li>${intent}</li>`).join('')}
                </ul>
            </div>
            
            <div class="domain-section">
                <h4>Responses (${Object.keys(domain.responses).length})</h4>
                ${Object.entries(domain.responses).map(([name, templates]) => `
                    <div class="response-item">
                        <h5>${name}</h5>
                        <p>${templates.length} template(s)</p>
                    </div>
                `).join('')}
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
    } catch (err) {
        document.getElementById('domain-container').innerHTML = `Error: ${err.message}`;
    }
}

// Add this style to your HTML or add it dynamically
document.head.insertAdjacentHTML('beforeend', `
    <style>
        .tab-buttons { margin-bottom: 20px; }
        .tab-buttons button { margin-right: 10px; padding: 5px 10px; }
        .template, .template-view { border: 1px solid #ccc; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .domain-section { margin-bottom: 20px; padding: 10px; border: 1px solid #eee; }
        .response-item { padding: 5px 10px; margin: 5px 0; background: #f5f5f5; }
        #responseFormContainer, form div { margin-bottom: 10px; }
        label { display: inline-block; min-width: 150px; }
    </style>
`);


// -------- INTENTS --------
async function renderIntents() {
    const res = await fetch(`${API_BASE}/intents`);
    const data = await res.json();
    let html = `<h2>Intents</h2>
    <form id="intentForm">
        <input name="name" placeholder="Intent name" required>
        <input name="examples" placeholder="Examples (comma separated)">
        <button type="submit">Add Intent</button>
    </form>
    <table><tr><th>ID</th><th>Name</th><th>Examples</th><th>Actions</th></tr>`;
    data.forEach(i => {
        html += `<tr>
            <td>${i.id}</td>
            <td>${i.name}</td>
            <td>${(i.IntentExamples || []).map(e => e.text).join('<br>')}</td>
            <td>
                <button class="action" onclick="deleteIntent(${i.id})">Delete</button>
            </td>
        </tr>`;
    });
    html += `</table>`;
    document.getElementById('content').innerHTML = html;
    document.getElementById('intentForm').onsubmit = async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        await fetch(`${API_BASE}/intents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: fd.get('name'),
                examples: fd.get('examples') ? fd.get('examples').split(',').map(s => s.trim()) : []
            })
        });
        renderIntents();
    };
}
async function deleteIntent(id) {
    if (confirm('Delete intent?')) {
        await fetch(`${API_BASE}/intents/${id}`, { method: 'DELETE' });
        renderIntents();
    }
}

// -------- STORIES --------
async function renderStories() {
    // Fetch stories
    const res = await fetch(`${API_BASE}/stories`);
    const data = await res.json();

    let html = `<h2>Stories</h2>
    <form id="storyForm">
        <input name="name" placeholder="Story name" required>
        <div id="stepsContainer">
            <div class="step-row">
                <select name="stepType[]" class="step-type">
                    <option value="intent">intent</option>
                    <option value="action">action</option>
                </select>
                <input name="stepName[]" placeholder="Name" required>
                <button type="button" class="add-step">+</button>
            </div>
        </div>
        <button type="submit">Add Story</button>
    </form>
    <table><tr><th>ID</th><th>Name</th><th>Steps</th><th>Actions</th></tr>`;

    data.forEach(s => {
        html += `<tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${(s.StorySteps || []).map(st => `${st.type}:${st.name}`).join('<br>')}</td>
            <td>
                <button class="action" onclick="deleteStory(${s.id})">Delete</button>
            </td>
        </tr>`;
    });
    html += `</table>`;
    document.getElementById('content').innerHTML = html;

    // Add event listener for the "Add Step" button
    document.querySelector('.add-step').addEventListener('click', function () {
        const newStep = document.createElement('div');
        newStep.className = 'step-row';
        newStep.innerHTML = `
            <select name="stepType[]" class="step-type">
                <option value="intent">intent</option>
                <option value="action">action</option>
            </select>
            <input name="stepName[]" placeholder="Name" required>
            <button type="button" class="remove-step">-</button>
        `;
        document.getElementById('stepsContainer').appendChild(newStep);

        // Add event listener for the remove button
        newStep.querySelector('.remove-step').addEventListener('click', function () {
            this.parentElement.remove();
        });
    });

    document.getElementById('storyForm').onsubmit = async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const types = fd.getAll('stepType[]');
        const names = fd.getAll('stepName[]');

        const steps = types.map((type, index) => ({
            type: type,
            name: names[index]
        })).filter(s => s.type && s.name);

        await fetch(`${API_BASE}/stories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: fd.get('name'), steps })
        });
        renderStories();
    };
}
async function deleteStory(id) {
    if (confirm('Delete story?')) {
        await fetch(`${API_BASE}/stories/${id}`, { method: 'DELETE' });
        renderStories();
    }
}

// -------- RULES --------
async function renderRules() {
    const res = await fetch(`${API_BASE}/rules`);
    const data = await res.json();
    let html = `<h2>Rules</h2>
    <form id="ruleForm">
        <input name="name" placeholder="Rule name" required>
        <input name="steps" placeholder="Steps (type:name, e.g. intent:greet,action:utter_hello)">
        <button type="submit">Add Rule</button>
    </form>
    <table><tr><th>ID</th><th>Name</th><th>Steps</th><th>Actions</th></tr>`;
    data.forEach(r => {
        html += `<tr>
            <td>${r.id}</td>
            <td>${r.name}</td>
            <td>${(r.RuleSteps || []).map(st => `${st.type}:${st.name}`).join('<br>')}</td>
            <td>
                <button class="action" onclick="deleteRule(${r.id})">Delete</button>
            </td>
        </tr>`;
    });
    html += `</table>`;
    document.getElementById('content').innerHTML = html;
    document.getElementById('ruleForm').onsubmit = async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const steps = fd.get('steps').split(',').map(s => {
            const [type, name] = s.split(':');
            return { type: type.trim(), name: name.trim() };
        }).filter(s => s.type && s.name);
        await fetch(`${API_BASE}/rules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: fd.get('name'), steps })
        });
        renderRules();
    };
}
async function deleteRule(id) {
    if (confirm('Delete rule?')) {
        await fetch(`${API_BASE}/rules/${id}`, { method: 'DELETE' });
        renderRules();
    }
}

// -------- INTENT EXAMPLES --------
async function renderIntentExamples() {
    // First, fetch all intents to populate the dropdown
    const intentsRes = await fetch(`${API_BASE}/intents`);
    const intents = await intentsRes.json();

    // Then fetch the examples
    const res = await fetch(`${API_BASE}/intent-examples`);
    const data = await res.json();

    let html = `<h2>Intent Examples</h2>
    <form id="intentExampleForm">
        <input name="text" placeholder="Example text" required>
        <select name="IntentId" required>
            <option value="">Select Intent</option>
            ${intents.map(intent => `<option value="${intent.id}">${intent.name}</option>`).join('')}
        </select>
        <button type="submit">Add Example</button>
    </form>
    <table><tr><th>ID</th><th>Text</th><th>IntentId</th><th>Intent Name</th><th>Actions</th></tr>`;

    // Create a map of intent IDs to names for displaying intent names
    const intentMap = {};
    intents.forEach(intent => intentMap[intent.id] = intent.name);

    data.forEach(e => {
        html += `<tr>
            <td>${e.id}</td>
            <td>${e.text}</td>
            <td>${e.IntentId}</td>
            <td>${intentMap[e.IntentId] || 'Unknown'}</td>
            <td>
                <button class="action" onclick="deleteIntentExample(${e.id})">Delete</button>
            </td>
        </tr>`;
    });
    html += `</table>`;
    document.getElementById('content').innerHTML = html;
    document.getElementById('intentExampleForm').onsubmit = async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        await fetch(`${API_BASE}/intent-examples`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: fd.get('text'),
                IntentId: Number(fd.get('IntentId'))
            })
        });
        renderIntentExamples();
    };
}
async function deleteIntentExample(id) {
    if (confirm('Delete example?')) {
        await fetch(`${API_BASE}/intent-examples/${id}`, { method: 'DELETE' });
        renderIntentExamples();
    }
}

// -------- STORY STEPS --------
async function renderStorySteps() {
    const res = await fetch(`${API_BASE}/story-steps`);
    const data = await res.json();
    let html = `<h2>Story Steps</h2>
    <form id="storyStepForm">
        <input name="type" placeholder="Type (intent/action)" required>
        <input name="name" placeholder="Name" required>
        <input name="order" placeholder="Order" type="number">
        <input name="StoryId" placeholder="Story ID" required type="number">
        <button type="submit">Add Step</button>
    </form>
    <table><tr><th>ID</th><th>Type</th><th>Name</th><th>Order</th><th>StoryId</th><th>Actions</th></tr>`;
    data.forEach(st => {
        html += `<tr>
            <td>${st.id}</td>
            <td>${st.type}</td>
            <td>${st.name}</td>
            <td>${st.order || ''}</td>
            <td>${st.StoryId}</td>
            <td>
                <button class="action" onclick="deleteStoryStep(${st.id})">Delete</button>
            </td>
        </tr>`;
    });
    html += `</table>`;
    document.getElementById('content').innerHTML = html;
    document.getElementById('storyStepForm').onsubmit = async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        await fetch(`${API_BASE}/story-steps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: fd.get('type'),
                name: fd.get('name'),
                order: fd.get('order') ? Number(fd.get('order')) : undefined,
                StoryId: Number(fd.get('StoryId'))
            })
        });
        renderStorySteps();
    };
}
async function deleteStoryStep(id) {
    if (confirm('Delete step?')) {
        await fetch(`${API_BASE}/story-steps/${id}`, { method: 'DELETE' });
        renderStorySteps();
    }
}

// -------- TRAIN --------
function renderTrain() {
    document.getElementById('content').innerHTML = `
        <h2>Train Rasa Model</h2>
        <button id="trainBtn">Train Now</button>
        <div id="trainResult"></div>
    `;
    document.getElementById('trainBtn').onclick = async () => {
        document.getElementById('trainResult').innerHTML = 'Training...';
        const res = await fetch(`${API_BASE}/train`, { method: 'POST' });
        const data = await res.json();
        document.getElementById('trainResult').innerHTML = data.message ?
            `Success: ${data.message}<br>Model: ${data.model}` :
            `Error: ${data.error || 'Unknown error'}`;
    };
}

// Show default tab
showTab('intents');