// -------- INTENTS --------
async function renderIntents() {
    try {
        const res = await fetch(`${API_BASE}/intents`);
        // Mengambil data intents dari endpoint API

        if (!res.ok) {
            throw new Error(`Failed to fetch intents: ${res.status} ${res.statusText}`);
            // Jika response gagal, lempar error
        }

        const data = await res.json();
        // Parse response menjadi objek JavaScript

        let html = `<h2>Intents Chatbot FAQ</h2>
        <p class="description">Intents merepresentasikan maksud dari suatu pertanyaan dari user agar chatbot dapat mengenali maksud pertanyaan tertentu sesuai dari intents yang telah dimiliki. tambahkan intent baru serta example agar chatbot dapat mengenali pertanyaan baru.</p>
        <form id="intentForm" class="add-form">
            <div class="form-group">
                <label for="intentName">Nama Intent:</label>
                <input id="intentName" name="name" placeholder="Nama Intent (e.g. greet, goodbye)" required>
            </div>
            <button type="submit" class="primary-btn">Tambah Intent</button>
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
        // Membuat form tambah intent dan header tabel

        if (data.length === 0) {
            html += `<tr><td colspan="5" class="no-data">No intents found. Add your first intent above.</td></tr>`;
            // Jika belum ada intent, tampilkan pesan
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
                        <button class="add-example-btn" onclick="addExample(${i.id})">+ Tambah Example</button>
                    </td>
                    <td>
                        <button class="action edit" onclick="editIntent(${i.id})">Edit</button>
                        <button class="action delete" onclick="deleteIntent(${i.id})">Delete</button>
                    </td>
                </tr>`;
                // Untuk setiap intent, tampilkan data dan tombol aksi
            });
        }

        html += `</table>`;

        document.getElementById('content').innerHTML = html;
        // Tampilkan HTML ke elemen #content

        // Tambahkan style dinamis untuk tampilan form dan tabel
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
                .checkbox-group {
                    margin-bottom: 15px;
                    display: flex;
                    align-items: flex-start;
                }
                .checkbox-group input[type="checkbox"] {
                    margin-right: 10px;
                    margin-top: 4px;
                }
                .checkbox-group label {
                    font-weight: bold;
                    margin-right: 10px;
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
                .domain-status {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 3px;
                    font-size: 0.9em;
                    font-weight: 500;
                }
                .domain-status.synced {
                    background-color: #d4edda;
                    color: #155724;
                }
                .domain-status.not-synced {
                    background-color: #f8d7da;
                    color: #721c24;
                }
                .sync-btn {
                    display: block;
                    border: none;
                    background-color: #007bff;
                    color: white;
                    padding: 3px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    margin-top: 5px;
                    font-size: 0.85em;
                }
                .sync-btn:hover {
                    background-color: #0069d9;
                }
            </style>
        `);

        document.getElementById('intentForm').onsubmit = async e => {
            e.preventDefault();
            // Mencegah reload halaman saat submit form
            const fd = new FormData(e.target);
            const messageEl = document.getElementById('message');
            const defaultResponse = fd.get('defaultResponse') || `This is a default response for ${fd.get('name')}`;

            try {
                // 1. Create the regular intent
                const intentResponse = await fetch(`${API_BASE}/intents`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: fd.get('name'),
                        examples: fd.get('examples') ? fd.get('examples').split(',').map(s => s.trim()).filter(s => s) : []
                    })
                });

                if (!intentResponse.ok) {
                    const errorData = await intentResponse.json();
                    throw new Error(errorData.error || 'Failed to create intent');
                }

                // Get the created intent data to use its ID for domain mapping
                const intentData = await intentResponse.json();

                // 2. If auto sync is enabled, create domain intent and response
                if (true) {
                    // Create domain intent
                    const domainIntentResponse = await fetch(`${API_BASE}/domain-db/intents`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: fd.get('name') })
                    });

                    if (!domainIntentResponse.ok) {
                        console.error('Failed to create domain intent');
                    }

                    // Create domain response (utter_{intent_name})
                    const utterName = `utter_${fd.get('name')}`;
                    const domainResponseResponse = await fetch(`${API_BASE}/domain-db/responses`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: utterName,
                            templates: [{ text: defaultResponse }]
                        })
                    });

                    if (!domainResponseResponse.ok) {
                        console.error('Failed to create domain response');
                    }

                    // Update the intent to mark it as having domain mapping
                    await fetch(`${API_BASE}/intents/${intentData.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            hasDomainMapping: true
                        })
                    });
                }

                // Tampilkan pesan sukses
                messageEl.textContent = `Intent created successfully and Domain intent and utter response also created.`;
                messageEl.className = 'message success';
                messageEl.style.display = 'block';

                // Reset form
                e.target.reset();

                // Sembunyikan pesan setelah 3 detik
                setTimeout(() => {
                    messageEl.style.display = 'none';
                }, 3000);

                // Refresh daftar intents
                renderIntents();
            } catch (error) {
                messageEl.textContent = `Error: ${error.message}`;
                messageEl.className = 'message error';
                messageEl.style.display = 'block';

                // Sembunyikan pesan error setelah 5 detik
                setTimeout(() => {
                    messageEl.style.display = 'none';
                }, 5000);
            }
        };

        // Check if we need to add the hasDomainMapping property to existing intents
        checkDomainMappings(data);

    } catch (error) {
        document.getElementById('content').innerHTML = `
            <div class="error-container">
                <h2>Error</h2>
                <p>${error.message}</p>
                <button onclick="renderIntents()">Try Again</button>
            </div>
        `;
        // Jika error saat fetch, tampilkan pesan error
    }
}

// Function to check and update domain mappings for existing intents
async function checkDomainMappings(intents) {
    try {
        // Get all domain intents
        const domainIntentsRes = await fetch(`${API_BASE}/domain-db/intents`);
        const domainIntents = await domainIntentsRes.json();

        // Create a map for faster lookup
        const domainIntentMap = {};
        domainIntents.forEach(intent => {
            domainIntentMap[intent.name] = intent.id;
        });

        // Check each intent to see if it has a domain mapping
        for (const intent of intents) {
            // Skip if we already know it has a mapping
            if (intent.hasDomainMapping === true) continue;

            // Check if there's a corresponding domain intent
            if (domainIntentMap[intent.name]) {
                // Update the intent to mark it as having domain mapping
                await fetch(`${API_BASE}/intents/${intent.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        hasDomainMapping: true
                    })
                });
            }
        }
    } catch (error) {
        console.error("Failed to check domain mappings:", error);
    }
}

// Fungsi untuk menambah contoh kalimat pada intent tertentu dalam kolom examples
async function addExample(intentId) {
    const example = prompt('Enter the example text:');
    if (!example || !example.trim()) return;

    try {
        const response = await fetch(`${API_BASE}/intent-examples`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `- ${example.trim()}`,
                IntentId: intentId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add example');
        }

        renderIntents(); // Refresh tampilan
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Fungsi untuk menghapus contoh kalimat pada intent dalam kolom examples
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

        renderIntents(); // Refresh tampilan
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Fungsi untuk menghapus intent beserta semua contoh kalimatnya dalam kolom actions
async function deleteIntent(id) {
    if (confirm('apakah kamu yakin ingin menghapus intent ini? Semua EXAMPLE dalam INTENT ini akan terhapus. Domain intent dan utter response terkait juga akan dihapus.')) {
        try {
            // Get the intent details first to know its name
            const intentRes = await fetch(`${API_BASE}/intents/${id}`);

            if (!intentRes.ok) {
                throw new Error(`Failed to get intent details: ${intentRes.status}`);
            }

            const intentData = await intentRes.json();
            const intentName = intentData.name;
            const utterName = `utter_${intentName}`;

            // 1. Find and delete domain intent
            const domainIntentsRes = await fetch(`${API_BASE}/domain-db/intents/${intentName}/name-exists`);
            const domainIntentsExists = await domainIntentsRes.json();

            // 2. Find domain response (utter_{intent_name})
            const domainResponseRes = await fetch(`${API_BASE}/domain-db/responses/${utterName}/name-exists`);
            const domainResponseExists = await domainResponseRes.json();

            // First, try to delete domain mappings if they exist
            if (domainIntentsExists.length !== 0 && domainResponseExists.length !== 0) {
                try {
                    const deleteIntentRes = await fetch(`${API_BASE}/domain-db/intents/${domainIntentsExists?.id}`, { method: 'DELETE' });


                    if (!deleteIntentRes.ok) {
                        console.error(`Failed to delete domain intent: ${deleteIntentRes.status}`);
                    } else {
                        console.log(`Successfully deleted domain intent: ${intentName}`);
                    }

                    const deleteResponseRes = await fetch(`${API_BASE}/domain-db/responses/${domainResponseExists?.id}`, { method: 'DELETE' });

                    if (!deleteResponseRes.ok) {
                        console.error(`Failed to delete domain response: ${deleteResponseRes.status}`);
                    } else {
                        console.log(`Successfully deleted domain response: ${utterName}`);
                    }

                } catch (mappingError) {
                    // If domain mapping deletion fails, log it but continue with intent deletion
                    console.error("Error deleting domain mappings:", mappingError);
                    // We don't want to block the intent deletion if domain mappings fail to delete
                }
            }

            // Now delete the actual intent
            const response = await fetch(`${API_BASE}/intents/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to delete intent: ${response.status}`);
            }

            // Show success message
            const messageContainer = document.createElement('div');
            messageContainer.className = 'success-toast';
            messageContainer.textContent = `Intent "${intentName}" deleted successfully. ${intentData.hasDomainMapping ? 'Domain intent and utter response also deleted.' : ''}`;
            document.body.appendChild(messageContainer);

            // Remove the success message after 3 seconds
            setTimeout(() => {
                messageContainer.remove();
            }, 3000);

            renderIntents();
        } catch (error) {
            alert(`Error deleting intent: ${error.message}`);
            console.error("Full error:", error);
        }
    }
}

// Function to sync an intent to domain
async function syncToDomain(intentId, intentName) {
    try {
        // Create domain intent
        const domainIntentResponse = await fetch(`${API_BASE}/domain-db/intents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: intentName })
        });

        if (!domainIntentResponse.ok) {
            throw new Error('Failed to create domain intent');
        }

        // Create domain response (utter_{intent_name})
        const utterName = `utter_${intentName}`;
        const defaultResponse = `This is a default response for ${intentName}`;

        const domainResponseResponse = await fetch(`${API_BASE}/domain-db/responses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: utterName,
                templates: [{ text: defaultResponse }]
            })
        });

        if (!domainResponseResponse.ok) {
            throw new Error('Failed to create domain response');
        }

        // Update the intent to mark it as having domain mapping
        await fetch(`${API_BASE}/intents/${intentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hasDomainMapping: true
            })
        });

        alert(`Successfully synced intent "${intentName}" to domain and created response "${utterName}"`);
        renderIntents();
    } catch (error) {
        alert(`Error syncing to domain: ${error.message}`);
    }
}

// Fungsi untuk menampilkan form edit intent dalam kolom actions
async function editIntent(id) {
    try {
        // Ambil detail intent
        const response = await fetch(`${API_BASE}/intents/${id}`);

        if (!response.ok) {
            throw new Error(`Failed to get intent details: ${response.status}`);
        }

        const intent = await response.json();
        const intentName = intent.name;
        const utterName = `utter_${intentName}`;

        // Check if there's a domain intent for this intent using name-exists endpoint
        let domainIntentExists = null;
        try {
            const domainIntentsRes = await fetch(`${API_BASE}/domain-db/intents/${intentName}/name-exists`);
            domainIntentExists = await domainIntentsRes.json();
        } catch (error) {
            console.error("Error checking domain intent:", error);
        }

        // Check if there's a domain response for this intent using name-exists endpoint
        let domainResponseExists = null;
        let defaultResponse = '';
        try {
            const domainResponseRes = await fetch(`${API_BASE}/domain-db/responses/${utterName}/name-exists`);
            domainResponseExists = await domainResponseRes.json();

            // Get response templates if available
            if (domainResponseExists && domainResponseExists.ResponseTemplates &&
                domainResponseExists.ResponseTemplates.length > 0) {
                defaultResponse = domainResponseExists.ResponseTemplates[0].text || '';
            }
        } catch (error) {
            console.error("Error checking domain response:", error);
        }

        // Buat form edit intent
        let html = `
            <h2>Edit Intent</h2>
            <form id="editIntentForm" class="add-form">
                <div class="form-group">
                    <label for="editIntentName">Intent Name:</label>
                    <p class="descriptions">ganti nama intent jika perlu, abaikan jika tidak ingin mengubah nama intent, tekan tombol cancel jika ingin kembali</p>
                    <input id="editIntentName" name="name" value="${intentName}" required>
                </div>
                
                <input type="hidden" name="id" value="${intent.id}">
                <input type="hidden" name="hasDomainMapping" value="${intent.hasDomainMapping || false}">
                <input type="hidden" name="domainIntentId" value="${domainIntentExists?.id || ''}">
                <input type="hidden" name="responseId" value="${domainResponseExists?.id || ''}">
                
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
        // Tampilkan form edit intent

        // Tambahkan style dinamis untuk tampilan edit
        document.head.insertAdjacentHTML('beforeend', `
            <style>
                .success-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background-color: #d4edda;
                    color: #155724;
                    padding: 10px 20px;
                    border-radius: 4px;
                    border-left: 5px solid #28a745;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    z-index: 1000;
                    animation: slideIn 0.3s, fadeOut 0.5s 2.5s;
                    max-width: 400px;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                .descriptions {
                    color: #6c757d;
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

        // Handle submit form edit intent (update name dan domain mapping)
        document.getElementById('editIntentForm').onsubmit = async e => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const messageEl = document.getElementById('edit-message');
            const originalName = intentName;
            const newName = fd.get('name');
            const defaultResponse = fd.get('defaultResponse') || `This is a default response for ${newName}`;
            const hasDomainMapping = fd.get('hasDomainMapping') === 'true';
            const domainIntentId = fd.get('domainIntentId');
            const responseId = fd.get('responseId');

            try {
                // 1. Update the intent name in the main database
                const response = await fetch(`${API_BASE}/intents/${fd.get('id')}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: newName,
                        hasDomainMapping: true, // Always set to true if updating domain
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update intent');
                }

                // 2. If updating domain mappings, update or create domain intent and response
                if (true) {
                    // Handle domain intent update/creation based on existence
                    if (domainIntentExists && domainIntentExists.length !== 0) {
                        // Update existing domain intent
                        const updateIntentRes = await fetch(`${API_BASE}/domain-db/intents/${domainIntentExists.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: newName })
                        });

                        if (!updateIntentRes.ok) {
                            console.error(`Failed to update domain intent: ${updateIntentRes.status}`);
                        } else {
                            console.log(`Successfully updated domain intent: ${originalName} -> ${newName}`);
                        }
                    } else {
                        // Create new domain intent
                        const createIntentRes = await fetch(`${API_BASE}/domain-db/intents`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: newName })
                        });

                        if (!createIntentRes.ok) {
                            console.error(`Failed to create domain intent: ${createIntentRes.status}`);
                        } else {
                            console.log(`Successfully created domain intent: ${newName}`);
                        }
                    }

                    // Handle domain response update/creation based on existence
                    const oldUtterName = `utter_${originalName}`;
                    const newUtterName = `utter_${newName}`;

                    if (domainResponseExists && domainResponseExists.length !== 0) {
                        // Update existing domain response
                        const updateResponseRes = await fetch(`${API_BASE}/domain-db/responses/${domainResponseExists.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: newUtterName,
                                // templates: [{ text: defaultResponse }]
                            })
                        });

                        if (!updateResponseRes.ok) {
                            console.error(`Failed to update domain response: ${updateResponseRes.status}`);
                        } else {
                            console.log(`Successfully updated domain response: ${oldUtterName} -> ${newUtterName}`);
                        }
                    } else {
                        // Create new domain response
                        const createResponseRes = await fetch(`${API_BASE}/domain-db/responses`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: newUtterName,
                                templates: [{ text: defaultResponse }]
                            })
                        });

                        if (!createResponseRes.ok) {
                            console.error(`Failed to create domain response: ${createResponseRes.status}`);
                        } else {
                            console.log(`Successfully created domain response: ${newUtterName}`);
                        }
                    }
                }

                // Show success toast
                const messageContainer = document.createElement('div');
                messageContainer.className = 'success-toast';
                // messageContainer.textContent = `Intent "${originalName}" updated to "${newName}". ${updateDomain ? 'Domain intent and utter response also updated.' : ''}`;
                document.body.appendChild(messageContainer);

                // Remove the success message after 3 seconds
                setTimeout(() => {
                    messageContainer.remove();
                    renderIntents();
                }, 3000);
            } catch (error) {
                messageEl.textContent = `Error: ${error.message}`;
                messageEl.className = 'message error';
                messageEl.style.display = 'block';

                // Sembunyikan pesan error setelah 5 detik
                setTimeout(() => {
                    messageEl.style.display = 'none';
                }, 5000);
            }
        };
    } catch (error) {
        alert(`Error deleting intent: ${error.message}`);
        console.error("Full error:", error);
        renderIntents();
    }
}

// Fungsi untuk menambah contoh kalimat dari halaman edit intent
async function addExampleFromEdit(intentId) {
    const newExampleInput = document.getElementById('new-example');
    const example = newExampleInput.value.trim();

    if (!example) {
        alert('Tolong masukkan contoh kalimat.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/intent-examples`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `- ${example}`,
                IntentId: intentId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add example');
        }

        // Kosongkan input setelah berhasil
        newExampleInput.value = '';

        // Refresh halaman edit intent
        editIntent(intentId);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Fungsi untuk mengedit contoh kalimat pada intent
async function editExample(exampleId) {
    try {
        // Ambil data contoh kalimat
        const response = await fetch(`${API_BASE}/intent-examples/${exampleId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch example');
        }

        const example = await response.json();

        // Prompt untuk input teks baru
        const newText = prompt('Edit example:', example.text);
        if (!newText || newText.trim() === example.text) return;

        // Update contoh kalimat
        const updateResponse = await fetch(`${API_BASE}/intent-examples/${exampleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `- ${newText.trim()}`
            })
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(errorData.error || 'Failed to update example');
        }

        // Refresh halaman edit intent
        editIntent(example.IntentId);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}