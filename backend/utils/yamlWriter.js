const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const writeYAMLFiles = async ({ intents, stories, rules }) => {
    const nlu = intents.map(intent => ({
        intent: intent.name,
        examples: intent.examples.map(e => `- ${e}`).join('\n')
    }));

    const nluYaml = nlu.map(i => `- intent: ${i.intent}\n  examples: |\n    ${i.examples}`).join('\n\n');
    fs.writeFileSync(path.join(__dirname, '../../rasa-data/nlu.yml'), nluYaml);

    const storyYaml = stories.map(story => {
        const steps = story.steps
            .sort((a, b) => a.order - b.order)
            .map(step => `  - ${step.type}: ${step.value}`)
            .join('\n');
        return `- story: ${story.name}\n  steps:\n${steps}`;
    }).join('\n\n');
    fs.writeFileSync(path.join(__dirname, '../../rasa-data/stories.yml'), storyYaml);

    const ruleYaml = rules.map(rule => {
        const steps = rule.steps
            .sort((a, b) => a.order - b.order)
            .map(step => `  - ${step.type}: ${step.value}`)
            .join('\n');
        return `- rule: ${rule.name}\n  steps:\n${steps}`;
    }).join('\n\n');
    fs.writeFileSync(path.join(__dirname, '../../rasa-data/rules.yml'), ruleYaml);
};

module.exports = { writeYAMLFiles };