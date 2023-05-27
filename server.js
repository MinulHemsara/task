const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

dotenv.config();
const app = express();
const port = 8080;

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const con = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "",
  database: "sign",
});

con.getConnection((err, connection) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Connected to the database");
    connection.release();
  }
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/post", async (req, res) => {
  const {
    firstName,
    lastName,
    NIC,
    address,
    phoneNo,
    gender,
    email,
    profession,
    country,
    education,
  } = req.body;

  try {
    const response = await promptAI(prompt);
    res.send(response);

    const sql =
      "INSERT INTO register (firstName, lastName, NIC, address, contact, gender, email, profession, country, education) VALUES (?,?,?,?,?,?,?,?,?,?)";
    const values = [
      firstName,
      lastName,
      NIC,
      address,
      phoneNo,
      gender,
      email,
      profession,
      country,
      education,
    ];

    con.query(sql, values, (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error occurred while posting");
      } else {
        console.log("Posted");
      }
    });
  } catch (error) {
    console.error("Error processing AI prompt:", error);
    res.status(500).send("Error occurred while processing AI prompt");
  }
});

app.get("/get", (req, res) => {
  const sql = "SELECT * FROM register";

  con.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error occurred while retrieving data");
    } else {
      console.log("Retrieved data");
      res.send(result);
    }
  });
});

const promptAI = async (prompt) => {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0.7,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  const summary = response.data.choices[0].text.trim();
  console.log(summary);

  return summary;
};

promptAI().then((res) => console.log(res));

app.listen(port, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Server is running on port ${port}`);
  }
});
