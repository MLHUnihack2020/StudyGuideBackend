const express = require('express')
const app = express();

const cors = require('cors');
app.use(cors());
app.use(express.json());

const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();

const PORT = process.env.PORT || 8080

app.post('/', async (req, res) => {
  const text = req.body.text;
  // const text = `A hairbrush is a handle brush with rigid or soft spokes used in hair care for smoothing, styling, and detangling human hair, or for grooming an animal's fur. It can also be used for styling in combination with a curling iron or hair dryer.
  // Julienne Mathieu's hair being brushed, then combed and styled in the 1908 French film Hôtel électrique.
  // A flat brush is normally used for detangling hair, for example after sleep or showering. A round brush can be used for styling and curling hair, especially by a professional stylist, often with a hair dryer. A paddle brush is used to straighten hair and tame fly-aways. For babies with fine, soft hair, many bristle materials are not suitable due to the hardness; some synthetic materials and horse/goat hair bristles are used instead.`;
  const questionBank = [];
  let response = { flashcards: [] };
  let sentences = getSentences(text);
  let obj = null;

  for (let i in sentences) {

    let s = sentences[i];

    if (s.length > 0) {
      console.log("S : " + s);
      const document = {
        content: s,
        type: 'PLAIN_TEXT'
      };

      const [result] = await client.analyzeEntities({document});
      const entities = result.entities; // entities from every sentence

      let max = 0;
      let found = false;

      entities.every(entity => {
        console.log(entity)
        if (entity.type == "PERSON" || entity.type == "LOCATION" || entity.type == "ORGANIZATION") {
          obj = entity;
          found = true;
          return false;
        }
      });

      if (!found) {
        entities.every(entity => {
          if (entity.salience > max) { // if not person, then get max salience
            max = entity.salience;
            obj = entity;
          }
        });
      }

      let question = s;
      const answer = obj.name;

      question = question.replace(answer, "{" + answer.length + "}")

      response['flashcards'].push({ question: question, answer: answer })
    }
  }
  
  
  // entities.forEach(entity => {
  //   if (entity.salience > threshold || (entity.type == "PERSON" || entity.type == "LOCATION" || entity.type == "ORGANIZATION" || entity.type == "CONSUMER_GOOD" || entity.type == "WORK_OF_ART")) {
  //     if (entity.name.trim().indexOf(' ') == -1) {
        
  //         let key = entity.name;

  //         let index = text.indexOf(key);
          
  //         while (true) {
  //           if (index - 1 >= 0 && index + 1 < text.length) {
  //             console.log(index);
  //             console.log(text[index - 1] + " | text | " + text[index + key.length])
  //             if (!isAlpha(text[index - 1]) && !isAlpha(text[index + key.length])) {
  //               break;
  //             } else {
  //               index = text.indexOf(key, index + 1);
  //             }
  //           }
  //         }

  //         let period = text.indexOf('.');
  //         let prevPeriod = period;
  //         let question = '';

  //         if (period > index) {
  //           question = text.substring(0, period).trim();
  //         } else {
  //           while (period < index) {
  //             prevPeriod = period;
  //             period = text.indexOf('.', period + 1);
  //           }
  //           question = text.substring(prevPeriod, period).trim();
  //         }

  //         questionBank.push({[entity.name]: question});

  //         response['flashcards'].push({ question: question, answer: entity.name })
  //     }
  //   }
  // });

  res.send(JSON.stringify(response));
});

function getSentences(s) {
  return s.split('.');
}


function isAlpha(s) {
  let alphabet = "abcdefghijklmnopqrstuvwxyz";
  return alphabet.indexOf(s) >= 0;
}

app.listen(PORT, () => {
  console.log('Listening on port ' + PORT + '.');
});
