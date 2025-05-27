const fs = require('fs');
const path = require('path');
const axios = require('axios');

const trainRasaModel = async () => {
    const config = fs.readFileSync(path.join(__dirname, '../../rasa-data/config.yml'), 'utf-8');
    const domain = fs.readFileSync(path.join(__dirname, '../../rasa-data/domain.yml'), 'utf-8');
    const nlu = fs.readFileSync(path.join(__dirname, '../../rasa-data/nlu.yml'), 'utf-8');
    const stories = fs.readFileSync(path.join(__dirname, '../../rasa-data/stories.yml'), 'utf-8');
    const rules = fs.readFileSync(path.join(__dirname, '../../rasa-data/rules.yml'), 'utf-8');

    const response = await axios.post('http://localhost:5005/model/train', {
        config,
        domain,
        nlu,
        stories,
        rules,
        force: true,
        save_to_default_model_directory: false
    }, { responseType: 'arraybuffer' });

    const modelName = `model_${Date.now()}.tar.gz`;
    fs.writeFileSync(path.join(__dirname, `../../models/${modelName}`), response.data);
    return modelName;
};

module.exports = { trainRasaModel };