// modules inladen
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var myConnection = require('express-myconnection');
var path = require('path');
var app = express();
var multer = require('multer');
var fs = require('fs');

// foto upload destination bepalen
var upload = multer({dest: 'public/uploads/'});

app.use(upload.single('bs-file'));

// mysql connectie aanmaken
app.use(myConnection(mysql, {
    host: '192.168.56.101',
    port: 3306,
    user: 'student',
    password: 'serverSide',
    database: 'projecttech'
}, 'single'))

// Define bodyparser (handles POST requests)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static(path.join(__dirname, 'public')));
// images in ../public/images/..

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// session setup
app.use(session({
    secret: "YourSuperSecretStringWithStrangeCharacters#@$!",
    resave: false,
    saveUninitialized: true
}));
var sess;

//routes

//login pagina get
app.get('/', function (req, res) {
    if (req.session.ingelogd) {
        res.redirect('/jouwprofiel');
    } else {
        res.render('index');
    }
});

//login pagina post
app.post('/', function (req, res) {
    sess = req.session;

    req.getConnection(function (err, connection) {
        if (err) {
            console.log('Error connecting to Db');
            return;
        } else {
            console.log('Connection established');
        }
        connection.query("SELECT * FROM user WHERE email=?", [req.body.username], function (err, result) {
            if (err) {
                console.log(err);
            }
            /** check of er resultaten zijn en of het wachtwoord dat je invult overeen komt met wat er uit de database komt.
            Verder wordt er bij de eerste if gecheckt of je admin bent en bij de tweede check of je geblokkeerd bent**/
            if (result[0] && result[0].password == req.body.password && result[0].admin == 1) {
                req.session.ingelogd = true;
                req.session.isadmin = true;
                req.session.ID = result[0].ID;
                req.session.naam = result[0].naam;
                req.session.geboortedatum = result[0].geboortedatum;
                req.session.geslacht = result[0].geslacht;
                req.session.woonplaats = result[0].woonplaats;
                req.session.opzoekgeslacht = result[0].opzoekgeslacht;
                req.session.username = req.body.username;
                req.session.foto = result[0].foto;
                res.redirect('/overzicht');
            } else if (result[0] && result[0].password == req.body.password && result[0].geblokkeerd == 0) {
                req.session.ingelogd = true;
                req.session.ID = result[0].ID;
                req.session.naam = result[0].naam;
                req.session.geboortedatum = result[0].geboortedatum;
                req.session.geslacht = result[0].geslacht;
                req.session.woonplaats = result[0].woonplaats;
                req.session.opzoekgeslacht = result[0].opzoekgeslacht;
                req.session.username = req.body.username;
                req.session.foto = result[0].foto;
                res.redirect('/matches');
            } else {
                res.send('Invalid username or email');
            }
        });

    });
});

// dashboard pagina get
app.get('/dashboard', function (req, res) {
    if (req.session.ingelogd) {
        res.render('dashboard');
    } else {
        res.redirect('/');
    }
});

// instellingen pagina get
app.get('/instellingen', function (req, res) {
    if (req.session.ingelogd) {
        res.render('instellingen');
    } else {
        res.redirect('/');
    }
});

// instellingen pagina post
app.post('/instellingen', function (req, res) {
    req.getConnection(function (err, connection) {
        if (err) {
            console.log('Error connecting to Db');
            return;
        }
        console.log('Connection established');
        // plaats alles wat de gebruiker in heeft gevuld in een object.
        var dataAanpassen = {
            'password': req.body.aanpassenwachtwoord,
            'opzoekgeslacht': req.body.aanpassenopzoekgeslacht,
            'minleeftijd': req.body.aanpassenminleeftijd,
            'maxleeftijd': req.body.aanpassenmaxleeftijd
        };
        var updateQuery = connection.query("UPDATE user SET ? WHERE ID=?", [dataAanpassen, req.session.ID], function (err, result) {
            if (err) {
                console.log('Fout bij updaten');
            } else {
                res.redirect('/jouwprofiel');
                // log de query in de console.
                console.log(updateQuery.sql);
            }
        });
    });
});

// jouwprofiel pagina get
app.get('/jouwprofiel', function (req, res) {
    if (req.session.ingelogd) {
        // stuur variabelen uit de sessie mee naar de ejs template.
        res.locals.geslacht = req.session.geslacht;
        res.locals.username = req.session.username;
        res.locals.foto = req.session.foto;
        res.render('jouwprofiel');
    } else {
        res.redirect('/');
    }
});

// jouwprofiel pagina post
app.post('/jouwprofiel', function (req, res) {
    if(req.file !== undefined) {
    // Move the file
        fs.rename(req.file.path, req.file.destination + req.file.originalname, function(err){

        });
        req.getConnection(function (err, connection) {
            if (err) {
                console.log('Error connecting to Db');
                return;
            } else {
                console.log('Connection established /jouwprofiel');
            }
            // plaats de naam van de afbeelding die geupload is in de correcte foto colom met behulp van de sessie ID van de gebruiker.
            connection.query("UPDATE user SET foto = ? WHERE ID = ?", [req.file.originalname, req.session.ID], function (err, result) {
                if (err) {
                    console.log('Fout bij inserten');
                } else {
                    console.log(req.file.originalname);
                }
            });
        });
    }
});

// matches pagina get
app.get('/matches', function (req, res, next) {
    if (req.session.ingelogd) {
        req.getConnection(function (err, connection) {
            if (err) {
                console.log('Error connecting to Db');
                return;
            } else {
                console.log('Connection established');
            }
            /* haal alle gebruikers uit de database wiens geslacht gelijk is aan het geslacht waar de gebruiker naar zoekt
            en bij wie het geslacht dat ze zoeken overeen komt met het geslacht van de gebruiker. */
            connection.query("SELECT * FROM user WHERE geslacht = ? AND opzoekgeslacht = ?", [req.session.opzoekgeslacht, req.session.geslacht], function (err, resultmatch) {
                if (err) {
                  console.log('Fout bij ophalen');
                } else {
                  console.log('Matches succesvol weergeven');
                  res.locals.resultmatch = resultmatch;
                  res.render('matches');
                  console.log(resultmatch[0].naam);
                }
            });
        });
    } else {
        res.redirect('/');
    }
});

// overzicht pagina get (admin pagina)
app.get('/overzicht', function (req, res) {
    // check of de gebruiker is ingelogd en of deze admin is in de sessie.
    if (req.session.ingelogd && req.session.isadmin) {
        req.getConnection(function (err, connection) {
            if (err) {
                console.log('Error connecting to Db');
                return;
            } else {
                console.log('Connection established /overzicht');
            }
            connection.query("SELECT * FROM user", function (err, result) {
                // laat alle gebruikers in de database zien.
                if (err) {
                  console.log('Fout bij ophalen');
                } else {
                  res.locals.data = result;
                  res.render('overzicht');
                }
            });
        });
    } else {
        res.redirect('/');
    }
});

// registeren pagina get
app.get('/registreren', function (req, res) {
    res.render('registreren');
});

// registreren pagina post
app.post('/registreren', function (req, res) {
    req.getConnection(function (err, connection) {
        if (err) {
            console.log('Error connecting to Db');
            return;
        }
        console.log('Connection established');
        // plaats alle gegevens die door de registrerende gebruik zijn ingevuld in een object. Dit maakt het eenvoudig om in de database te plaatsen.
        var user = {
            'naam': req.body.naam,
            'geboortedatum': req.body.geboortedatum,
            'geslacht': req.body.geslacht,
            'email': req.body.username,
            'password': req.body.password,
            'woonplaats': req.body.woonplaats,
            'opzoekgeslacht': req.body.opzoekgeslacht,
            'minleeftijd': req.body.minleeftijd,
            'maxleeftijd': req.body.maxleeftijd
        };
        // insert het object in de database.
        var query = connection.query("INSERT INTO user SET ?", [user], function (err, result) {
            if (err) {
                console.log('insert mislukt');
            } else {
                // na de registratie wordt gelijk een sessie aangemaakt en wordt de gebruiker naar zijn eigen profiel doorverwezen.
                req.session.ingelogd = true;
                req.session.username = req.body.username;
                req.session.password = req.body.password;
                res.locals.username = req.session.username;
                console.log(query.sql);
                res.redirect('/jouwprofiel');
            }
        });
    });
});

// profiel pagina get
app.get('/profiel/:id', function (req, res, next) {
    if (req.session.ingelogd) {
        var profielid = req.params.id;
        console.log(req.params.id);
        req.session.paramsid = req.params.id;
        res.locals.userid = req.session.ID;
        req.getConnection(function (err, connection) {
            if (err) {
                console.log('Error connecting to Db');
                return;
            }
            // haal de id uit de url en zoek daar de user bij uit de database.
            connection.query("SELECT * FROM user WHERE ID = ?", [profielid], function (err, result) {
                if (err) {
                  console.log('error met query en id');
                } else {
                  res.locals.naam = result[0].naam;
                  res.locals.geslacht = result[0].geslacht;
                  res.locals.foto = result[0].foto;
                  console.log(profielid);
                  // verzamel alle chat berichten waarin de gebruiker en de eigenaar van het profiel bijhoren.
                  connection.query("SELECT * FROM projecttech.chat LEFT JOIN projecttech.user ON chat.verzenderid = projecttech.user.ID WHERE verzenderid = ? AND ontvangerid = ? OR ontvangerid = ? AND verzenderid = ? ORDER BY projecttech.chat.id", [req.session.ID, profielid, req.session.ID, profielid], function(err, chat) {
                      if (err) {
                      }
                        console.log(chat);
                        res.locals.chat = chat;
                        res.render('profiel');
                  });
                }
            });

        });
    } else {
        res.redirect('/');
    }
});

// profiel pagina post
app.post('/profiel/:id', function (req, res) {
    req.getConnection(function (err, connection) {
        if (err) {
            console.log('Error connecting to Db');
            return;
        }
        console.log('Connection established');
        // object waarin alle gegevens van een chatbericht worden gestopt.
        var data = {
            'verzenderid': req.session.ID,
            'ontvangerid': req.params.id,
            'bericht': req.body.bericht,
            'tijd': Date.now()
        };
        // bericht wordt in de chat tabel geïnsert.
        connection.query("INSERT INTO chat SET ?", [data], function (err, result) {
            if (err) {
                console.log('chat insert mislukt');
            } else {
                res.redirect('/profiel/' + req.session.paramsid);
            }
        });
    });
});

// logout pagina get
app.get('/logout', function (req, res) {
    // sessie wordt verwijderd en de gebruiker wordt naar de login pagina verwezen, waar hij alleen kan komen zonder sessie.
    req.session.destroy(function () {
        res.redirect("/");
    });
});

// verwijder pagina get (voor de gebruiker zelf om het eigen profiel te verwijderen)
app.get('/verwijder', function(req, res) {
    req.getConnection(function (err, connection) {
        if (err) {
            console.log('Error connecting to Db');
            return;
        }
        // verwijder alles van de gebruiker met de ID uit de sessie en verwijs de gebruiker vervolgens naar de login pagina.
        connection.query("DELETE FROM user WHERE ID=? limit 1", [req.session.ID], function (err, result) {
            if (err) {
              console.log('error met verwijderen');
            } else {
              res.redirect("/logout");
            }
        });
    });

});

// verwijderpersoon pagina get (alleen gebruikt door de admin om gebruikers te verwijderen vanuit /overzicht)
app.get('/verwijderpersoon', function(req, res) {
    req.query.id;
    req.getConnection(function (err, connection) {
        if (err) {
            console.log('Error connecting to Db');
            return;
        }
        // verwijder een gebruiker naar keuze. Met een limiet van 1 entity zodat je zeker weet dat je niet meer entity's uit je database verwijdert.
        connection.query("DELETE FROM user WHERE ID=? limit 1", [req.query.id], function (err, result) {
            if (err) {
              console.log('error met verwijderen persoon');
            } else {
              res.redirect("/overzicht");
            }
        });
    });

});

// blokkeerpersoon pagina get (alleen gebruikt door de admin om gebruikers te blokkeren vanuit /overzicht)
app.get('/blokkeerpersoon', function(req, res) {
    req.query.id;
    req.getConnection(function (err, connection) {
        if (err) {
            console.log('Error connecting to Db');
            return;
        }
        var  blokkeer = {
            'geblokkeerd' : 1
        }
        // zet de geblokkeerd status van een gebruiker naar keuze op 1. Dit zorgt ervoor dat deze gebruiker niet meer in kan loggen.
        connection.query("UPDATE user SET ? WHERE ID=?", [blokkeer, req.query.id], function (err, result) {
            if (err) {
              console.log('error met blokkeren persoon');
            } else {
              res.redirect("/overzicht");
            }
        });
    });

});

// api routes

app.get('/api', function(req, res, next) {
  	if (req.session.ingelogd) {
  		  res.redirect("/matches");
  	}

  	req.getConnection(function(err, connection){
        if(err) return next(err);
        // Run a query on the database, pass an error if something fails
        connection.query('SELECT * FROM user WHERE email = ?', [req.query.email], function(err, result) {
            if(err) return next(err);
            // Pass the result (if any) to the template
            if(result.length>0) {
                result[0].status = 'ok';
                res.json(result[0]);
        				console.log(result)
            } else {
                res.json({status:'error'});
            }
        });
    });

})

// einde api routes


app.listen(3000, function () {
    console.log("Webserver gestart op poort 3000");
});
