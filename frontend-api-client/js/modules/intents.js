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
            <div class="form-group">
                <label for="intentExamples">Examples:</label>
                <textarea id="intentExamples" name="examples" placeholder="Examples (comma separated, e.g. hello, hi there, greetings)" rows="3"></textarea>
                <span class="hint">Enter comma-separated phrases that represent this intent</span>
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
            html += `<tr><td colspan="4" class="no-data">No intents found. Add your first intent above.</td></tr>`;
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
            // Mencegah reload halaman saat submit form
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
                // Kirim data intent baru ke backend

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to create intent');
                }

                // Tampilkan pesan sukses
                messageEl.textContent = 'Intent created successfully!';
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

// Fungsi untuk menambah contoh kalimat pada intent tertentu dalam kolom examples
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
    if (confirm('apakah kamu yakin ingin menghapus intent ini? Semua EXAMPLE dalam INTENT ini akan terhapus.')) {
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

// Fungsi untuk menampilkan form edit intent dalam kolom actions
async function editIntent(id) {
    try {
        // Ambil detail intent
        const response = await fetch(`${API_BASE}/intents/${id}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch intent');
        }

        const intent = await response.json();

        // Buat form edit intent
        let html = `
            <h2>Edit Intent</h2>
            <form id="editIntentForm" class="add-form">
                <div class="form-group">
                    <label for="editIntentName">Intent Name:</label>
                    <p class="descriptions">ganti nama intent jika perlu, abaikan jika tidak ingin mengubah nama intent, tekan tombol cancel jika ingin kembali</p>
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
        // Tampilkan form edit intent

        // Tambahkan style dinamis untuk tampilan edit
        document.head.insertAdjacentHTML('beforeend', `
            <style>
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

        // Handle submit form edit intent (hanya update nama intent)
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
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update intent');
                }

                // Tampilkan pesan sukses
                messageEl.textContent = 'Intent name updated successfully!';
                messageEl.className = 'message success';
                messageEl.style.display = 'block';

                // Sembunyikan pesan setelah 3 detik
                setTimeout(() => {
                    messageEl.style.display = 'none';
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
        alert(`Error: ${error.message}`);
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
                text: example,
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
                text: newText.trim()
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