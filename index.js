const express = require('express')
const app = express();
const fs = require("fs");
const PDFDocument = require('pdfkit');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

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

  let response = await getQandA(text);
  

  res.send(JSON.stringify(response));
});

app.post('/pdf', async (req, res) => {
  const text = req.body.text;

  let response = await getQandA(text);

  let fileCode = parseInt(Math.random() * 10000000000)
  let filePath = "generatedPDFs/" + fileCode + ".pdf"

  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(filePath));

  for (i in response.flashcards) {
    let question = response.flashcards[i].question;
    let answer = response.flashcards[i].answer;

    let blankSize = answer.length;
    let blankSpot = "{" + blankSize + "}";

    let blanks = "";
    for (let j = 0; j < blankSize; j++) {
      blanks = blanks + "_";
    }

    let questionNumber = parseInt(i) + 1;
    let fixedQuestion = question.replace(blankSpot, blanks);

    doc.text('Question #' + questionNumber + ': ' + fixedQuestion, { 
      lineGap: 3
    });
    doc.text('Answer #' + questionNumber + ': ' + answer, { 
      lineGap: 3
    });
    doc.text(' ');
  }

  doc.end();

  await storage.bucket("studygenerator-pdfs").upload(filePath);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err)
      return
    }
  })

  let newResponse = {
    pdfDownload: "https://storage.googleapis.com/studygenerator-pdfs/" + fileCode + ".pdf"
  }

  res.send(JSON.stringify(newResponse));
});

async function getQandA(text) {
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

  return response;
}

function getSentences(s) {
  return s.split('.');
}

app.listen(PORT, () => {
  console.log('Listening on port ' + PORT + '.');
});
