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

// Add common styles
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

// Show default tab based on current page
(function () {
    const path = window.location.pathname;
    if (path.includes('intents.html')) showTab('intents');
    else if (path.includes('stories.html')) showTab('stories');
    else if (path.includes('rules.html')) showTab('rules');
    else if (path.includes('intent_examples.html')) showTab('intent-examples');
    else if (path.includes('story_steps.html')) showTab('story-steps');
    else if (path.includes('train.html')) showTab('train');
    else if (path.includes('domain.html')) showTab('domain');
    else showTab('intents'); // Default
})();