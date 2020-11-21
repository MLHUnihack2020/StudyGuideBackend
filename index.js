const express = require('express')
const app = express();

const cors = require('cors');
app.use(cors());
app.use(express.json());

const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();

const PORT = process.env.PORT || 8080

app.get('/', async (req, res) => {
  const text = `A mango is a stone fruit produced from numerous species of tropical trees belonging to the flowering plant genus Mangifera, cultivated mostly for their edible fruit. Most of these species are found in nature as wild mangoes. The genus belongs to the cashew family Anacardiaceae. Mangoes are native to South Asia,[1][2] from where the "common mango" or "Indian mango", Mangifera indica, has been distributed worldwide to become one of the most widely cultivated fruits in the tropics. Other Mangifera species (e.g. horse mango, Mangifera foetida) are grown on a more localized basis. Worldwide, there are several hundred cultivars of mango. Depending on the cultivar, mango fruit varies in size, shape, sweetness, skin color, and flesh color which may be pale yellow, gold, or orange.[1] Mango is the national fruit of India, Haiti, and the Philippines,[3] and the national tree of Bangladesh.[4] It is the summer national fruit of Pakistan.`
  console.log("Length: " + text.length);
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  const [result] = await client.analyzeEntities({document});
  const entities = result.entities;

  const questionBank = [];

  let threshold = 0;
  let x = 0;

  entities.forEach(entity => {
    threshold += entity.salience;
    x++;
  });

  threshold = threshold/x;

  entities.forEach(entity => {
    if (entity.salience > threshold || (entity.type == "PERSON" || entity.type == "LOCATION" || entity.type == "ORGANIZATION" || entity.type == "CONSUMER_GOOD" || entity.type == "WORK_OF_ART")) {
      if (entity.name.trim().indexOf(' ') == -1) {
        
          let key = entity.name;

          let index = text.indexOf(key);
          let period = text.indexOf('.');
          let prevPeriod = period;
          let question = '';

          if (period > index) {
            question = text.substring(0, period).trim();
          } else {
            while (period < index) {
              console.log(period + " " + index);
              prevPeriod = period;
              period = text.indexOf('.', period + 1);
            }
            question = text.substring(prevPeriod, period).trim();
          }

          console.log(key);         
          questionBank.push({[entity.name]: question});
      }
    }
  });



  console.log(questionBank)


  // console.log('Entities:');
  // entities.forEach(entity => {
  //   console.log(entity.name);
  //   console.log(` - Type: ${entity.type}, Salience: ${entity.salience}`);
  //   if (entity.metadata && entity.metadata.wikipedia_url) {
  //     console.log(` - Wikipedia URL: ${entity.metadata.wikipedia_url}`);
  //   }
  // });

});

app.post('/', function (req, res) {
  const body = req.body;

  console.log(req.body.text);

  res.send(JSON.stringify("{ result: \"test\" }"));
})

app.listen(PORT, () => {
  console.log('Listening on port ' + PORT + '.');
});
