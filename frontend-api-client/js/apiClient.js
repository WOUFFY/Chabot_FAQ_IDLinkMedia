const API_BASE = 'http://localhost:3000/api';

function showTab(tab) {
    document.getElementById('content').innerHTML = 'Loading...';
    switch(tab) {
        case 'intents': renderIntents(); break;
        case 'stories': renderStories(); break;
        case 'rules': renderRules(); break;
        case 'intent-examples': renderIntentExamples(); break;
        case 'story-steps': renderStorySteps(); break;
        case 'train': renderTrain(); break;
    }
}

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
            <td>${(i.IntentExamples||[]).map(e=>e.text).join('<br>')}</td>
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
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
                name: fd.get('name'),
                examples: fd.get('examples') ? fd.get('examples').split(',').map(s=>s.trim()) : []
            })
        });
        renderIntents();
    };
}
async function deleteIntent(id) {
    if(confirm('Delete intent?')) {
        await fetch(`${API_BASE}/intents/${id}`, {method:'DELETE'});
        renderIntents();
    }
}

// -------- STORIES --------
async function renderStories() {
    const res = await fetch(`${API_BASE}/stories`);
    const data = await res.json();
    let html = `<h2>Stories</h2>
    <form id="storyForm">
        <input name="name" placeholder="Story name" required>
        <input name="steps" placeholder="Steps (type:name, e.g. intent:greet,action:utter_hello)">
        <button type="submit">Add Story</button>
    </form>
    <table><tr><th>ID</th><th>Name</th><th>Steps</th><th>Actions</th></tr>`;
    data.forEach(s => {
        html += `<tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${(s.StorySteps||[]).map(st=>`${st.type}:${st.name}`).join('<br>')}</td>
            <td>
                <button class="action" onclick="deleteStory(${s.id})">Delete</button>
            </td>
        </tr>`;
    });
    html += `</table>`;
    document.getElementById('content').innerHTML = html;
    document.getElementById('storyForm').onsubmit = async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const steps = fd.get('steps').split(',').map(s=>{
            const [type,name] = s.split(':');
            return {type:type.trim(), name:name.trim()};
        }).filter(s=>s.type&&s.name);
        await fetch(`${API_BASE}/stories`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ name: fd.get('name'), steps })
        });
        renderStories();
    };
}
async function deleteStory(id) {
    if(confirm('Delete story?')) {
        await fetch(`${API_BASE}/stories/${id}`, {method:'DELETE'});
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
            <td>${(r.RuleSteps||[]).map(st=>`${st.type}:${st.name}`).join('<br>')}</td>
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
        const steps = fd.get('steps').split(',').map(s=>{
            const [type,name] = s.split(':');
            return {type:type.trim(), name:name.trim()};
        }).filter(s=>s.type&&s.name);
        await fetch(`${API_BASE}/rules`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ name: fd.get('name'), steps })
        });
        renderRules();
    };
}
async function deleteRule(id) {
    if(confirm('Delete rule?')) {
        await fetch(`${API_BASE}/rules/${id}`, {method:'DELETE'});
        renderRules();
    }
}

// -------- INTENT EXAMPLES --------
async function renderIntentExamples() {
    const res = await fetch(`${API_BASE}/intent-examples`);
    const data = await res.json();
    let html = `<h2>Intent Examples</h2>
    <form id="intentExampleForm">
        <input name="text" placeholder="Example text" required>
        <input name="IntentId" placeholder="Intent ID" required type="number">
        <button type="submit">Add Example</button>
    </form>
    <table><tr><th>ID</th><th>Text</th><th>IntentId</th><th>Actions</th></tr>`;
    data.forEach(e => {
        html += `<tr>
            <td>${e.id}</td>
            <td>${e.text}</td>
            <td>${e.IntentId}</td>
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
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
                text: fd.get('text'),
                IntentId: Number(fd.get('IntentId'))
            })
        });
        renderIntentExamples();
    };
}
async function deleteIntentExample(id) {
    if(confirm('Delete example?')) {
        await fetch(`${API_BASE}/intent-examples/${id}`, {method:'DELETE'});
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
            <td>${st.order||''}</td>
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
            headers: {'Content-Type':'application/json'},
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
    if(confirm('Delete step?')) {
        await fetch(`${API_BASE}/story-steps/${id}`, {method:'DELETE'});
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
        const res = await fetch(`${API_BASE}/train`, {method:'POST'});
        const data = await res.json();
        document.getElementById('trainResult').innerHTML = data.message ? 
            `Success: ${data.message}<br>Model: ${data.model}` : 
            `Error: ${data.error||'Unknown error'}`;
    };
}

// Show default tab
showTab('intents');