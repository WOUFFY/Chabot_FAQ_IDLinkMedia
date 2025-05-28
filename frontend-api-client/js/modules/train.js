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