const express = require('express')
const app = express();

const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();

const PORT = process.env.PORT || 8080

app.get('/', async (req, res) => {
  const text = 'Hello, world!';

  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  const [result] = await client.analyzeSentiment({document: document});
  const sentiment = result.documentSentiment;

  res.send(`Text: ${text}` + `Sentiment score: ${sentiment.score}` + `Sentiment magnitude: ${sentiment.magnitude}`);
});

app.listen(PORT, () => {
  console.log('Listening on port ' + PORT + '.');
});
