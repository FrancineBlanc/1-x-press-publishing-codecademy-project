const express = require('express');
const artistsRouter = express.Router();

const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');

artistsRouter.param('artistId', (req, res, next, artistId) => {
    db.get('SELECT * FROM Artist WHERE Artist.id = $artistId',
        {
            $artistId: artistId
        },
        (error, artist) => {
            if (error) {
                next(error);
            } else if (artist) {
                req.artist = artist;
                next();
            } else {
                res.sendStatus(404);
            }
        }
    );
});

artistsRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Artist WHERE Artist.is_currently_employed = 1', (error, artists) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json({ artists: artists });
        }
    });

});

artistsRouter.get('/:artistId', (req, res, next) => {
    res.status(200).json({ artist: req.artist });
});

artistsRouter.post('/', (req, res, next) => {
    const artist = req.body.artist;

    if (!artist.name || !artist.dateOfBirth || !artist.biography) {
        return res.status(400).send();
    }

    if (artist.isCurrentlyEmployed === 0) {
        artist.isCurrentlyEmployed = 0;
    } else {
        artist.isCurrentlyEmployed = 1;
    }

    db.run('INSERT INTO Artist(name, date_of_birth, biography, is_currently_employed) VALUES($name, $dateOfBirth, $biography, $isCurrentlyEmployed)',
        {
            $name: artist.name,
            $dateOfBirth: artist.dateOfBirth,
            $biography: artist.biography,
            $isCurrentlyEmployed: artist.isCurrentlyEmployed
        },
        function (error) {
            if (error) {
                next(error);
            } else {
                db.get('SELECT * FROM Artist WHERE Artist.id = $artistId',
                    {
                        $artistId: this.lastID
                    },
                    (error, artist) => {
                        res.status(201).json({ artist: artist });
                    }
                )
            }
        }
    )
});

artistsRouter.put('/:artistId', (req, res, next) => {
    const name = req.body.artist.name;
    const dateOfBirth = req.body.artist.dateOfBirth;
    const biography = req.body.artist.biography;
    const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;

    if (!name || !dateOfBirth || !biography) {
        return res.sendStatus(400);
    }

    db.run('UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, biography = $biography, is_currently_employed = $isCurrentlyEmployed WHERE Artist.id = $artistId',
    {
        $name: name,
        $dateOfBirth: dateOfBirth,
        $biography: biography,
        $isCurrentlyEmployed: isCurrentlyEmployed,
        $artistId: req.params.artistId
    },
    (error) => {
            if (error) {
                next(error);
            } else {
                db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`, (error, artist) => {
                    res.status(200).json({ artist: artist });
                });
            }
        }
    )
});

artistsRouter.delete('/:artistId', (req, res, next) => {

    db.run(`UPDATE Artist SET is_currently_employed = 0 WHERE Artist.id = ${req.params.artistId}`, (error) => {
            if (error) {
                next(error);
            } else {
                db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`, (error, artist) => {
                    res.status(200).json({ artist: artist })
                });
            }
        });
});

module.exports = artistsRouter;