// Render Configuration Management UI
async function renderConfig() {
    const content = document.getElementById('content');

    try {
        // Fetch configuration from the API
        const response = await fetch(`${API_BASE}/config`);
        if (!response.ok) throw new Error('Failed to fetch configuration');

        const config = await response.json();

        // Create the UI
        let html = `
            <h2>Configuration Management</h2>
            <div class="tab-buttons">
                <button onclick="loadConfigFromYaml()">Load from YAML</button>
                <button onclick="saveConfigToYaml()">Save to YAML</button>
                <button onclick="resetConfig()">Reset to Default</button>
            </div>
            
            <div class="config-card">
                <h3>Basic Settings</h3>
                <div class="config-item">
                    <div class="config-item-content">
                        <div class="config-row">
                            <div class="config-label">Recipe:</div>
                            <div class="config-value">${config.recipe || 'default.v1'}</div>
                        </div>
                        <div class="config-row">
                            <div class="config-label">Language:</div>
                            <div class="config-value">${config.language || 'id'}</div>
                        </div>
                        <div class="config-row">
                            <div class="config-label">Assistant ID:</div>
                            <div class="config-value">${config.assistant_id || '-'}</div>
                        </div>
                    </div>
                    <div class="config-item-actions">
                        <button onclick="editBasicSettings()">Edit</button>
                    </div>
                </div>
            </div>
            
            <div class="config-card">
                <h3>Pipeline Components</h3>
                
                <!-- WhitespaceTokenizer -->
                <div class="config-item">
                    <div class="config-item-content">
                        <div class="config-item-header">WhitespaceTokenizer</div>
                        <div class="config-info">Tokenizes text by whitespace</div>
                    </div>
                </div>
                
                <!-- LexicalSyntacticFeaturizer -->
                <div class="config-item">
                    <div class="config-item-content">
                        <div class="config-item-header">LexicalSyntacticFeaturizer</div>
                        <div class="config-info">Creates lexical and syntactic features</div>
                    </div>
                </div>
                
                <!-- CountVectorsFeaturizer (default) -->
                <div class="config-item">
                    <div class="config-item-content">
                        <div class="config-item-header">CountVectorsFeaturizer</div>
                        <div class="config-info">Creates bag-of-words representation</div>
                    </div>
                </div>
                
                <!-- CountVectorsFeaturizer (with params) -->
                <div class="config-item">
                    <div class="config-item-content">
                        <div class="config-item-header">CountVectorsFeaturizer</div>
                        <div class="config-row">
                            <div class="config-label">analyzer:</div>
                            <div class="config-value">${findComponentParam(config.pipeline, 'CountVectorsFeaturizer', 'analyzer') || 'char_wb'}</div>
                        </div>
                        <div class="config-row">
                            <div class="config-label">min_ngram:</div>
                            <div class="config-value">${findComponentParam(config.pipeline, 'CountVectorsFeaturizer', 'min_ngram') || '1'}</div>
                        </div>
                        <div class="config-row">
                            <div class="config-label">max_ngram:</div>
                            <div class="config-value">${findComponentParam(config.pipeline, 'CountVectorsFeaturizer', 'max_ngram') || '4'}</div>
                        </div>
                    </div>
                    <div class="config-item-actions">
                        <button onclick="editComponent('CountVectorsFeaturizer')">Edit</button>
                    </div>
                </div>
                
                <!-- DIETClassifier -->
                <div class="config-item">
                    <div class="config-item-content">
                        <div class="config-item-header">DIETClassifier</div>
                        <div class="config-row">
                            <div class="config-label">epochs:</div>
                            <div class="config-value">${findComponentParam(config.pipeline, 'DIETClassifier', 'epochs') || '100'}</div>
                        </div>
                        <div class="config-row">
                            <div class="config-label">constrain_similarities:</div>
                            <div class="config-value">${findComponentParam(config.pipeline, 'DIETClassifier', 'constrain_similarities')}</div>
                        </div>
                    </div>
                    <div class="config-item-actions">
                        <button onclick="editComponent('DIETClassifier')">Edit</button>
                    </div>
                </div>
                
                <!-- ResponseSelector -->
                <div class="config-item">
                    <div class="config-item-content">
                        <div class="config-item-header">ResponseSelector</div>
                        <div class="config-row">
                            <div class="config-label">epochs:</div>
                            <div class="config-value">${findComponentParam(config.pipeline, 'ResponseSelector', 'epochs') || '100'}</div>
                        </div>
                        <div class="config-row">
                            <div class="config-label">constrain_similarities:</div>
                            <div class="config-value">${findComponentParam(config.pipeline, 'ResponseSelector', 'constrain_similarities')}</div>
                        </div>
                    </div>
                    <div class="config-item-actions">
                        <button onclick="editComponent('ResponseSelector')">Edit</button>
                    </div>
                </div>
                
                <!-- FallbackClassifier -->
                <div class="config-item">
                    <div class="config-item-content">
                        <div class="config-item-header">FallbackClassifier</div>
                        <div class="config-row">
                            <div class="config-label">threshold:</div>
                            <div class="config-value">${findComponentParam(config.pipeline, 'FallbackClassifier', 'threshold') || '0.5'}</div>
                        </div>
                        <div class="config-row">
                            <div class="config-label">ambiguity_threshold:</div>
                            <div class="config-value">${findComponentParam(config.pipeline, 'FallbackClassifier', 'ambiguity_threshold') || '0.1'}</div>
                        </div>
                    </div>
                    <div class="config-item-actions">
                        <button onclick="editComponent('FallbackClassifier')">Edit</button>
                    </div>
                </div>
            </div>
            
            <div class="config-card">
                <h3>Policies</h3>
                
                <!-- MemoizationPolicy -->
                <div class="config-item">
                    <div class="config-item-content">
                        <div class="config-item-header">MemoizationPolicy</div>
                        <div class="config-info">Remembers previous conversations</div>
                    </div>
                </div>
                
                <!-- RulePolicy -->
                <div class="config-item">
                    <div class="config-item-content">
                        <div class="config-item-header">RulePolicy</div>
                        <div class="config-row">
                            <div class="config-label">core_fallback_threshold:</div>
                            <div class="config-value" style="margin-left:10px">${findComponentParam(config.policies, 'RulePolicy', 'core_fallback_threshold') || '0.5'}</div>
                        </div>
                        <div class="config-row">
                            <div class="config-label">core_fallback_action_name:</div>
                            <div class="config-value" style="margin-left:40px">${findComponentParam(config.policies, 'RulePolicy', 'core_fallback_action_name') || 'utter_fallback'}</div>
                        </div>
                    </div>
                    <div class="config-item-actions">
                        <button onclick="editPolicy('RulePolicy')">Edit</button>
                    </div>
                </div>
                
                <!-- TEDPolicy -->
                <div class="config-item">
                    <div class="config-item-content">
                        <div class="config-item-header">TEDPolicy</div>
                        <div class="config-row">
                            <div class="config-label">max_history:</div>
                            <div class="config-value">${findComponentParam(config.policies, 'TEDPolicy', 'max_history') || '5'}</div>
                        </div>
                        <div class="config-row">
                            <div class="config-label">epochs:</div>
                            <div class="config-value">${findComponentParam(config.policies, 'TEDPolicy', 'epochs') || '100'}</div>
                        </div>
                        <div class="config-row">
                            <div class="config-label">constrain_similarities:</div>
                            <div class="config-value">${findComponentParam(config.policies, 'TEDPolicy', 'constrain_similarities')}</div>
                        </div>
                    </div>
                    <div class="config-item-actions">
                        <button onclick="editPolicy('TEDPolicy')">Edit</button>
                    </div>
                </div>
                
                <!-- UnexpecTEDIntentPolicy -->
                <div class="config-item">
                    <div class="config-item-content">
                        <div class="config-item-header">UnexpecTEDIntentPolicy</div>
                        <div class="config-row">
                            <div class="config-label">max_history:</div>
                            <div class="config-value">${findComponentParam(config.policies, 'UnexpecTEDIntentPolicy', 'max_history') || '5'}</div>
                        </div>
                        <div class="config-row">
                            <div class="config-label">epochs:</div>
                            <div class="config-value">${findComponentParam(config.policies, 'UnexpecTEDIntentPolicy', 'epochs') || '100'}</div>
                        </div>
                    </div>
                    <div class="config-item-actions">
                        <button onclick="editPolicy('UnexpecTEDIntentPolicy')">Edit</button>
                    </div>
                </div>
            </div>
            
            <!-- Edit modal -->
            <div id="editModal" class="modal">
                <div class="modal-content">
                    <span class="close-modal" onclick="closeEditModal()">&times;</span>
                    <h3 id="editModalTitle">Edit Component</h3>
                    <form id="editForm" onsubmit="saveComponentChanges(event)">
                        <input type="hidden" id="editComponentType" name="componentType" value="">
                        <input type="hidden" id="editComponentName" name="componentName" value="">
                        <div id="editFormFields"></div>
                        <div class="form-actions">
                            <button type="submit">Save Changes</button>
                            <button type="button" onclick="closeEditModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add additional styles
        document.head.insertAdjacentHTML('beforeend', `
            <style>
                .config-card {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    padding: 20px;
                    margin: 20px 0;
                }
                .config-item {
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    margin-bottom: 15px;
                    display: flex;
                    background: #f9f9f9;
                }
                .config-item-content {
                    padding: 15px;
                    flex: 1;
                }
                .config-item-actions {
                    padding: 15px;
                    display: flex;
                    align-items: center;
                    border-left: 1px solid #eee;
                }
                .config-item-header {
                    font-weight: bold;
                    font-size: 16px;
                    color: #333;
                    margin-bottom: 10px;
                }
                .config-info {
                    color: #666;
                    font-size: 14px;
                    font-style: italic;
                }
                .config-row {
                    display: flex;
                    margin: 5px 0;
                }
                .config-label {
                    font-weight: bold;
                    width: 180px;
                    color: #555;
                }
                .config-value {
                    flex: 1;
                }
                .modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                }
                .modal-content {
                    background-color: white;
                    margin: 10% auto;
                    padding: 20px;
                    border-radius: 8px;
                    width: 60%;
                    max-width: 600px;
                    position: relative;
                }
                .close-modal {
                    position: absolute;
                    right: 20px;
                    top: 15px;
                    font-size: 24px;
                    cursor: pointer;
                }
                .form-row {
                    margin-bottom: 15px;
                }
                .form-row label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                .form-row input, .form-row select {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                .form-actions {
                    margin-top: 20px;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }
                button {
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    border: none;
                    background: #007bff;
                    color: white;
                }
                button:hover {
                    background: #0069d9;
                }
            </style>
        `);

        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        console.error('Error fetching configuration:', error);
    }
}

// Helper function to find component parameter value
function findComponentParam(components, componentName, paramName) {
    if (!components) return null;
    // For CountVectorsFeaturizer with specific parameters, find the one with analyzer
    if (componentName === 'CountVectorsFeaturizer' && paramName === 'analyzer') {
        const component = components.find(c => c.name === componentName && c.analyzer);
        return component?.[paramName];
    }
    if (componentName === 'CountVectorsFeaturizer' && (paramName === 'min_ngram' || paramName === 'max_ngram')) {
        const component = components.find(c => c.name === componentName && c.analyzer);
        return component?.[paramName];
    }

    const component = components?.find(c => c.name === componentName);
    return component?.[paramName];
}

// Function to edit a pipeline component
function editComponent(componentName) {
    fetch(`${API_BASE}/config`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch configuration');
            return response.json();
        })
        .then(config => {
            // Find the specific component
            let component;

            if (componentName === 'CountVectorsFeaturizer') {
                component = config.pipeline.find(c => c.name === componentName && c.analyzer);
            } else {
                component = config.pipeline.find(c => c.name === componentName);
            }

            if (!component) {
                alert(`Component ${componentName} not found in configuration`);
                return;
            }

            // Set modal title and component info
            document.getElementById('editModalTitle').textContent = `Edit ${componentName}`;
            document.getElementById('editComponentType').value = 'pipeline';
            document.getElementById('editComponentName').value = componentName;

            // Create form fields for component parameters
            let fieldsHtml = '';

            // Handle specific parameters based on component type
            switch (componentName) {
                case 'CountVectorsFeaturizer':
                    fieldsHtml += `
                        <div class="form-row">
                            <label for="analyzer">analyzer:</label>
                            <select id="analyzer" name="analyzer">
                                <option value="word" ${component.analyzer === 'word' ? 'selected' : ''}>word</option>
                                <option value="char" ${component.analyzer === 'char' ? 'selected' : ''}>char</option>
                                <option value="char_wb" ${component.analyzer === 'char_wb' ? 'selected' : ''}>char_wb</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label for="min_ngram">min_ngram:</label>
                            <input type="number" id="min_ngram" name="min_ngram" value="${component.min_ngram || 1}" min="1" max="10" step="1">
                        </div>
                        <div class="form-row">
                            <label for="max_ngram">max_ngram:</label>
                            <input type="number" id="max_ngram" name="max_ngram" value="${component.max_ngram || 4}" min="1" max="10" step="1">
                        </div>
                    `;
                    break;

                case 'DIETClassifier':
                case 'ResponseSelector':
                    fieldsHtml += `
                        <div class="form-row">
                            <label for="epochs">epochs:</label>
                            <input type="number" id="epochs" name="epochs" value="${component.epochs || 100}" min="10" max="500" step="10">
                        </div>
                        <div class="form-row">
                            <label for="constrain_similarities">constrain_similarities:</label>
                            <select id="constrain_similarities" name="constrain_similarities">
                                <option value="true" ${component.constrain_similarities === true ? 'selected' : ''}>true</option>
                                <option value="false" ${component.constrain_similarities === false ? 'selected' : ''}>false</option>
                            </select>
                        </div>
                    `;
                    break;

                case 'FallbackClassifier':
                    fieldsHtml += `
                        <div class="form-row">
                            <label for="threshold">threshold:</label>
                            <input type="number" id="threshold" name="threshold" value="${component.threshold || 0.5}" min="0" max="1" step="0.1">
                        </div>
                        <div class="form-row">
                            <label for="ambiguity_threshold">ambiguity_threshold:</label>
                            <input type="number" id="ambiguity_threshold" name="ambiguity_threshold" value="${component.ambiguity_threshold || 0.1}" min="0" max="1" step="0.1">
                        </div>
                    `;
                    break;
            }

            document.getElementById('editFormFields').innerHTML = fieldsHtml;

            // Show the modal
            document.getElementById('editModal').style.display = 'block';
        })
        .catch(error => {
            alert(`Error: ${error.message}`);
        });
}

// Function to edit a policy
function editPolicy(policyName) {
    fetch(`${API_BASE}/config`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch configuration');
            return response.json();
        })
        .then(config => {
            // Find the specific policy
            const policy = config.policies.find(p => p.name === policyName);

            if (!policy) {
                alert(`Policy ${policyName} not found in configuration`);
                return;
            }

            // Set modal title and component info
            document.getElementById('editModalTitle').textContent = `Edit ${policyName}`;
            document.getElementById('editComponentType').value = 'policy';
            document.getElementById('editComponentName').value = policyName;

            // Create form fields for policy parameters
            let fieldsHtml = '';

            // Handle specific parameters based on policy type
            switch (policyName) {
                case 'RulePolicy':
                    fieldsHtml += `
                        <div class="form-row">
                            <label for="core_fallback_threshold">core_fallback_threshold:</label>
                            <input type="number" id="core_fallback_threshold" name="core_fallback_threshold" value="${policy.core_fallback_threshold || 0.5}" min="0" max="1" step="0.1">
                        </div>
                        <div class="form-row">
                            <label for="core_fallback_action_name">core_fallback_action_name:</label>
                            <input type="text" id="core_fallback_action_name" name="core_fallback_action_name" value="${policy.core_fallback_action_name || 'utter_fallback'}">
                        </div>
                    `;
                    break;

                case 'TEDPolicy':
                    fieldsHtml += `
                        <div class="form-row">
                            <label for="max_history">max_history:</label>
                            <input type="number" id="max_history" name="max_history" value="${policy.max_history || 5}" min="1" max="20" step="1">
                        </div>
                        <div class="form-row">
                            <label for="epochs">epochs:</label>
                            <input type="number" id="epochs" name="epochs" value="${policy.epochs || 100}" min="10" max="500" step="10">
                        </div>
                        <div class="form-row">
                            <label for="constrain_similarities">constrain_similarities:</label>
                            <select id="constrain_similarities" name="constrain_similarities">
                                <option value="true" ${policy.constrain_similarities === true ? 'selected' : ''}>true</option>
                                <option value="false" ${policy.constrain_similarities === false ? 'selected' : ''}>false</option>
                            </select>
                        </div>
                    `;
                    break;

                case 'UnexpecTEDIntentPolicy':
                    fieldsHtml += `
                        <div class="form-row">
                            <label for="max_history">max_history:</label>
                            <input type="number" id="max_history" name="max_history" value="${policy.max_history || 5}" min="1" max="20" step="1">
                        </div>
                        <div class="form-row">
                            <label for="epochs">epochs:</label>
                            <input type="number" id="epochs" name="epochs" value="${policy.epochs || 100}" min="10" max="500" step="10">
                        </div>
                    `;
                    break;
            }

            document.getElementById('editFormFields').innerHTML = fieldsHtml;

            // Show the modal
            document.getElementById('editModal').style.display = 'block';
        })
        .catch(error => {
            alert(`Error: ${error.message}`);
        });
}

// Function to edit basic settings
function editBasicSettings() {
    fetch(`${API_BASE}/config`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch configuration');
            return response.json();
        })
        .then(config => {
            // Set modal title and component info
            document.getElementById('editModalTitle').textContent = 'Edit Basic Settings';
            document.getElementById('editComponentType').value = 'basic';
            document.getElementById('editComponentName').value = 'settings';

            // Create form fields for basic settings
            let fieldsHtml = `
                <div class="form-row">
                    <label for="recipe">Recipe:</label>
                    <input type="text" id="recipe" name="recipe" value="${config.recipe || 'default.v1'}" required>
                </div>
                <div class="form-row">
                    <label for="language">Language:</label>
                    <select id="language" name="language">
                        <option value="id" ${config.language === 'id' ? 'selected' : ''}>Indonesian (id)</option>
                        <option value="en" ${config.language === 'en' ? 'selected' : ''}>English (en)</option>
                    </select>
                </div>
                <div class="form-row">
                    <label for="assistant_id">Assistant ID:</label>
                    <input type="text" id="assistant_id" name="assistant_id" value="${config.assistant_id || ''}">
                </div>
            `;

            document.getElementById('editFormFields').innerHTML = fieldsHtml;

            // Show the modal
            document.getElementById('editModal').style.display = 'block';
        })
        .catch(error => {
            alert(`Error: ${error.message}`);
        });
}

// Close the edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Save component changes
async function saveComponentChanges(event) {
    event.preventDefault();

    const formData = new FormData(document.getElementById('editForm'));
    const componentType = formData.get('componentType');
    const componentName = formData.get('componentName');

    try {
        // Get current config
        const response = await fetch(`${API_BASE}/config`);
        if (!response.ok) throw new Error('Failed to fetch configuration');

        const config = await response.json();

        // Update based on component type
        if (componentType === 'basic') {
            // Update basic settings
            config.recipe = formData.get('recipe');
            config.language = formData.get('language');
            config.assistant_id = formData.get('assistant_id') || null;

        } else if (componentType === 'pipeline') {
            // Find and update pipeline component
            if (componentName === 'CountVectorsFeaturizer') {
                // Find the CountVectorsFeaturizer with analyzer parameter
                const index = config.pipeline.findIndex(c => c.name === componentName && c.analyzer);

                if (index !== -1) {
                    config.pipeline[index] = {
                        name: componentName,
                        analyzer: formData.get('analyzer'),
                        min_ngram: Number(formData.get('min_ngram')),
                        max_ngram: Number(formData.get('max_ngram'))
                    };
                }
            } else if (componentName === 'DIETClassifier' || componentName === 'ResponseSelector') {
                const index = config.pipeline.findIndex(c => c.name === componentName);

                if (index !== -1) {
                    config.pipeline[index] = {
                        name: componentName,
                        epochs: Number(formData.get('epochs')),
                        constrain_similarities: formData.get('constrain_similarities') === 'true'
                    };
                }
            } else if (componentName === 'FallbackClassifier') {
                const index = config.pipeline.findIndex(c => c.name === componentName);

                if (index !== -1) {
                    config.pipeline[index] = {
                        name: componentName,
                        threshold: Number(formData.get('threshold')),
                        ambiguity_threshold: Number(formData.get('ambiguity_threshold'))
                    };
                }
            }

        } else if (componentType === 'policy') {
            // Find and update policy
            const index = config.policies.findIndex(p => p.name === componentName);

            if (index !== -1) {
                if (componentName === 'RulePolicy') {
                    config.policies[index] = {
                        name: componentName,
                        core_fallback_threshold: Number(formData.get('core_fallback_threshold')),
                        core_fallback_action_name: formData.get('core_fallback_action_name')
                    };
                } else if (componentName === 'TEDPolicy') {
                    config.policies[index] = {
                        name: componentName,
                        max_history: Number(formData.get('max_history')),
                        epochs: Number(formData.get('epochs')),
                        constrain_similarities: formData.get('constrain_similarities') === 'true'
                    };
                } else if (componentName === 'UnexpecTEDIntentPolicy') {
                    config.policies[index] = {
                        name: componentName,
                        max_history: Number(formData.get('max_history')),
                        epochs: Number(formData.get('epochs'))
                    };
                }
            }
        }

        // Save the updated config
        const saveResponse = await fetch(`${API_BASE}/config`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        if (!saveResponse.ok) {
            const errorData = await saveResponse.json();
            throw new Error(errorData.error || 'Failed to save configuration');
        }

        alert('Configuration updated successfully');
        closeEditModal();
        renderConfig();

    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function resetConfig() {
    if (!confirm('Are you sure you want to reset the configuration to default?')) return;

    try {
        const response = await fetch(`${API_BASE}/config/reset`, {
            method: 'POST'
        });

        if (!response.ok) throw new Error('Failed to reset configuration');

        alert('Configuration reset successfully');
        renderConfig();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function loadConfigFromYaml() {
    if (!confirm('This will load configuration from the config.yml file. Continue?')) return;

    try {
        const response = await fetch(`${API_BASE}/config/load`, {
            method: 'POST'
        });

        if (!response.ok) throw new Error('Failed to load configuration');

        alert('Configuration loaded successfully');
        renderConfig();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function saveConfigToYaml() {
    if (!confirm('This will save the current configuration to config.yml file. Continue?')) return;

    try {
        const response = await fetch(`${API_BASE}/config/save`, {
            method: 'POST'
        });

        if (!response.ok) throw new Error('Failed to save configuration');

        alert('Configuration saved to file successfully');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeEditModal();
    }
};