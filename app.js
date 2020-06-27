const EXP = require("express");
const HTTP = require("http");
const PATH = require("path");
const FS = require("fs");
const url = require("url");
const APP = EXP();
const MDATE = require("moment");
const { v4: uuidv4 } = require('uuid');
const { stringify } = require("querystring");
const { Console } = require("console");
const nodemon = require("nodemon");
var router = EXP.Router();

let noteDate = new MDATE().format('MMMM Do YYYY, h:mm:ss a');
let noteID = uuidv4();


// "use strict";
APP.use(EXP.urlencoded({ extended: true }));
APP.use(EXP.json());

const SERV_PORT = process.env.PORT || 3000;
const DIR = __dirname;

APP.get("/", (req, res) => { res.sendFile(PATH.join(DIR, "/public/index.html")); })

APP.get("/:urlTerm", (req, res) => {

    let term = req.params.urlTerm.toLowerCase();

    switch (term) {
        case "*":
        case "index":
            res.sendFile(PATH.join(DIR, "/public/index.html"));
            break;
        case "notes":
            res.sendFile(PATH.join(DIR, "/public/notes.html"));
            break;
        default: res.status(400).sendFile(PATH.join(DIR, "/public/error.html"));
            break;
    }
})

APP
    .route("/api/notes")
    .get((req, res) => {
        FS.readFile("./db/db.json", "utf8", (err, data) => {
            if (err) {
                console.log("ERROR", + err);
                res.status(400).sendFile(PATH.join(DIR, "/public/error.html"));
            }
            const notes = JSON.parse(data);
            res.send(notes);
        })
    })
    .post((req, res) => {

        const newNote = req.body;
        if (!newNote.title || newNote.title.trim() === "") {
            console.log("NO TITLE!");
            res.status(400).json({ msg: "Please include note title. Note was not recorded!" });

        } else if (!newNote.text || newNote.text.trim() === "") {
            console.log("NO NOTE TEXT!");
            res.status(400).json({ msg: "Please include note body text. Note was not recorded!" });

        } else {
            let noteArry = [];
            FS.readFile("./db/db.json", "utf8", (err, data) => {
                if (err) { console.log(" ERROR -> ;", err); }
                let parsedData = JSON.parse(data);
                parsedData.forEach(note => { noteArry.push(note); });


                newNote.date = noteDate; // Creates date of note submission
                newNote.id = noteID; // Creates date of note submission
                noteArry.push(newNote);

                FS.writeFile("./db/db.json", JSON.stringify(noteArry), (err) => {
                    if (err) {
                        console.log("ERROR -->", err);
                    }
                    console.log("Finalized.");
                    // console.log(noteArry);
                })
            });
            res.redirect("/");
        }
    })

APP.listen(SERV_PORT, (req, res) => {
    console.log(`Listening to PORT ${SERV_PORT} . . . .`);
})

