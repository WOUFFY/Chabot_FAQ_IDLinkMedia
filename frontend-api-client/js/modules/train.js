// -------- TRAIN --------
function renderTrain() {
    document.getElementById('content').innerHTML = `
        <h2>Train & Generate Rasa Files</h2>
        
        <div class="train-actions">
            <div class="action-card">
                <h3>Generate YAML Files</h3>
                <p>Create YAML files from database without training a model</p>
                <button id="generateYamlBtn" class="secondary-btn">Generate YAML</button>
                <div id="generateResult" class="result-box"></div>
            </div>
            
            <div class="action-card">
                <h3>Train Rasa Model</h3>
                <p>Generate YAML files and train a new model</p>
                <button id="trainBtn" class="primary-btn">Train Now</button>
                <div id="trainResult" class="result-box"></div>
            </div>
        </div>
        
        <style>
            .train-actions {
                display: flex;
                gap: 20px;
                margin-top: 20px;
            }
            .action-card {
                flex: 1;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                background-color: #f8f9fa;
            }
            .action-card h3 {
                margin-top: 0;
                color: #333;
            }
            .result-box {
                margin-top: 15px;
                padding: 10px;
                border-radius: 4px;
                min-height: 60px;
                background-color: #fff;
                border: 1px solid #e0e0e0;
            }
            .primary-btn {
                background-color: #007bff;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
            }
            .primary-btn:hover {
                background-color: #0069d9;
            }
            .secondary-btn {
                background-color: #6c757d;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
            }
            .secondary-btn:hover {
                background-color: #5a6268;
            }
            .success {
                color: #28a745;
            }
            .error {
                color: #dc3545;
            }
            p {
                color: #666;
                margin-bottom: 15px;
            }
        </style>
    `;

    // Generate YAML button handler
    document.getElementById('generateYamlBtn').onclick = async () => {
        try {
            const generateResult = document.getElementById('generateResult');
            generateResult.innerHTML = '<span class="loading">Generating YAML files...</span>';
            generateResult.className = 'result-box';

            const res = await fetch(`${API_BASE}/generate-yaml`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (data.error) {
                generateResult.innerHTML = `<span class="error">Error: ${data.error}<br>${data.message || ''}</span>`;
                return;
            }

            // Show success with stats
            generateResult.innerHTML = `
                <span class="success">YAML files generated successfully!</span>
                <br><br>
                <b>Stats:</b>
                <ul>
                    <li>Intents: ${data.stats.intents}</li>
                    <li>Domain Intents: ${data.stats.domainIntents}</li>
                    <li>Responses: ${data.stats.responses}</li>
                    <li>Actions: ${data.stats.actions || 0}</li>
                    <li>Slots: ${data.stats.slots}</li>
                    <li>Stories: ${data.stats.stories}</li>
                    <li>Rules: ${data.stats.rules}</li>
                </ul>
            `;
        } catch (err) {
            document.getElementById('generateResult').innerHTML = `<span class="error">Error: ${err.message}</span>`;
        }
    };

    // Train button handler
    document.getElementById('trainBtn').onclick = async () => {
        try {
            const trainResult = document.getElementById('trainResult');
            trainResult.innerHTML = '<span class="loading">Training model... This may take several minutes.</span>';
            trainResult.className = 'result-box';

            const res = await fetch(`${API_BASE}/train`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (data.error) {
                trainResult.innerHTML = `<span class="error">Error: ${data.error}<br>${data.message || ''}</span>`;
                return;
            }

            // Show success with stats and model info
            trainResult.innerHTML = `
                <span class="success">${data.message}</span>
                <br><br>
                <b>Model:</b> ${data.model}
                <br><br>
                <b>Stats:</b>
                <ul>
                    <li>Intents: ${data.stats.intents}</li>
                    <li>Domain Intents: ${data.stats.domainIntents}</li>
                    <li>Responses: ${data.stats.responses}</li>
                    <li>Actions: ${data.stats.actions || 0}</li>
                    <li>Slots: ${data.stats.slots}</li>
                    <li>Stories: ${data.stats.stories}</li>
                    <li>Rules: ${data.stats.rules}</li>
                </ul>
            `;
        } catch (err) {
            document.getElementById('trainResult').innerHTML = `<span class="error">Error: ${err.message}</span>`;
        }
    };
}