const EXP = require("express");
const HTTP = require("http");
const PATH = require("path");
const FS = require("fs");
const url = require("url");
const APP = EXP();
const MDATE = require("moment");
const { stringify } = require("querystring");
const { Console } = require("console");
const e = require("express");
const { reset } = require("nodemon");
var router = EXP.Router();

let noteDate = new MDATE().format('MMMM Do YYYY, h:mm:ss a');

"use strict";
APP.use(EXP.urlencoded({ extended: false }));
APP.use(EXP.json());

const SERV_PORT = process.env.PORT || 3000;
const DIR = __dirname;
APP.use(EXP.static(PATH.join(__dirname, 'public')));

APP.get("/", (req, res) => { res.sendFile(PATH.join(DIR, "/public/index.html")); })

APP.get("/:urlTerm", (req, res) => {

    let term = req.params.urlTerm.toLowerCase();

    switch (term) {
        case "*":
        case "index":
        case "home":
            res.sendFile(PATH.join(DIR, "/public/index.html"));
            break;
        case "notes":
            res.sendFile(PATH.join(DIR, "/public/notes.html"));
            break;
        case "api":
            res.sendFile(PATH.join(DIR, "/public/apiInfo.html"));
            break;
        default: res.status(400).sendFile(PATH.join(DIR, "/public/error.html"));
            break;
    }
});
// 
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
            res.status(401).json({ msg: "Please include note title. Note was not recorded!" });

        } else if (!newNote.text || newNote.text.trim() === "") {
            console.log("NO NOTE TEXT!");
            res.status(401).json({ msg: "Please include note body text. Note was not recorded!" });

        } else {
            let noteArry = [];
            FS.readFile("./db/db.json", "utf8", (err, data) => {
                if (err) { console.log(" ERROR -> ;", err); }
                let parsedData = JSON.parse(data);
                parsedData.forEach(note => { noteArry.push(note); });

                if (parsedData.length >= 1) {
                    const prevId = parsedData[parsedData.length - 1].id;
                    newNote.id = prevId + 1; // Creates ID of note submission
                } else {
                    newNote.id = 1; // Creates ID of note submission
                }
                newNote.date = noteDate; // Creates date of note submission
                noteArry.push(newNote);

                FS.writeFile("./db/db.json", JSON.stringify(noteArry), (err) => {
                    if (err) {
                        console.log("ERROR -->", err);
                    }
                    console.log("Finalized.");
                    res.status(201).json({ msg: "Note was recorded!" });
                })
            });
        }
    })

APP.route("/api/notes/:id")
    .get((req, res) => { // Grabs note by specific ID
        FS.readFile("./db/db.json", "utf8", (err, data) => {
            if (err) { console.log("ERROR -->" + err) };

            let db = JSON.parse(data);

            let found = db.some(note => { return note.id === parseInt(req.params.id); });

            if (found === true) {
                console.log("FOUND NOTE");
                let requested_note = db.filter(reqNote => { return reqNote.id === parseInt(req.params.id) });
                res.json(requested_note);
            } else {
                console.log("NOTE NOTE FOUND");
                res.status(401).json({ msg: "Note Not found!" });
            }

            res.end();

        })
    })
    .put((req, res) => {  // Updating existing ID

        const upNote = req.body;
        FS.readFile("./db/db.json", "utf8", (err, data) => {
            if (err) { console.log("ERROR -->", + err) } // Checks for error and spits error out
            let db = JSON.parse(data); // Converts the read JSON file by parsing it and storing it in a var

            let found = db.some(n => { return n.id === parseInt(req.params.id) }); // Checks to see if ID user is requested exists in JSON db. True/False

            if (found === true) {

                db.forEach((noteObj, index, arr) => {

                    if (noteObj.id === parseInt(req.params.id)) {
                        noteObj.title = req.body.title;
                        noteObj.text = req.body.text;
                        noteObj.date = noteDate;
                    }
                })

                if (!upNote.title || upNote.title.trim() === "") {
                    console.log("NO TITLE!");
                    res.status(401).json({ msg: "Please include note title. Note was not updated!" });

                } else if (!upNote.text || upNote.text.trim() === "") {
                    console.log("NO NOTE TEXT!");
                    res.status(401).json({ msg: "Please include note body text. Note was not updated!" });

                } else {

                    FS.writeFile("./db/db.json", JSON.stringify(db), (err) => {
                        if (err) {
                            console.log("ERROR -->", err);
                        }
                        console.log("Finalized.");
                        res.status(201).json({ msg: "Note was recorded!" });
                    })
                }
            } else { res.json({ msg: "No id Exists!" }) }
        })
    })
    .delete((req, res) => {  // Delete a note
        noteArry = [];

        FS.readFile("./db/db.json", "utf8", (err, data) => {
            if (err) { console.log("ERROR --> ", + err); }

            let db = JSON.parse(data);

            let found = db.some(n => { return n.id === parseInt(req.params.id) }); // Checks to see if ID user is requested exists in JSON db. True/False

            if (found === true) {
                const updatedNoteArry = db.filter(note => {
                    if (note.id !== parseInt(req.params.id)) {
                        return note;
                    }
                })

                FS.writeFile("./db/db.json", JSON.stringify(updatedNoteArry), (err, data) => {
                    if (err) { console.log("ERROR --> ", + err); }
                    res.status(200).json({ msg: "Note was deleted!" });
                })

            } else {
                res.status(201).json({ msg: "Note ID  was not found!" });
            }
        })

    })

APP.listen(SERV_PORT, (req, res) => {
    console.log(`Listening to PORT ${SERV_PORT} . . . .`);
});

