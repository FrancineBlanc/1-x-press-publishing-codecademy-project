const express = require('express');
const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');
const issuesRouter = express.Router({mergeParams: true});

issuesRouter.param('issueId', (req, res, next, issueId) => {
    db.get('SELECT * FROM Issue WHERE Issue.id = $issueId', 
        {
            $issueId: issueId
        },
        (error, issue) => {
            if (error) {
                next (error);
            } else if (issue) {
                req.issue = issue;
                next();
            } else {
                res.status(404).send();
            }
        }
    ); 
});

issuesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Issue WHERE series_id = $seriesId', 
    {
        $seriesId: req.params.seriesId
    },
    (error, issues) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json({issues: issues});
        }
    });
});

issuesRouter.post('/', (req, res, next) => {
    const issue = req.body.issue;

    db.get('SELECT * FROM Artist WHERE Artist.id = $artistId', 
    {
        $artistId: issue.artistId
    },
    (error, artist) => {
        if (error) {
            next (error);
        } else {
            if (!issue.name || !issue.issueNumber || !issue.publicationDate || !issue.artistId) {
                res.status(400).send();
            }
            db.run('INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)', 
            {
                $name: issue.name,
                $issueNumber: issue.issueNumber,
                $publicationDate: issue.publicationDate,
                $artistId: issue.artistId,
                $seriesId: req.params.seriesId
            },
            function(error) {
                if (error) {
                    next(error);
                } else {
                    db.get('SELECT * FROM Issue WHERE Issue.id = $issueId', 
                        {
                            $issueId: this.lastID
                        },
                        (error, issue) => {
                            res.status(201).json({issue: issue});
                        } 
                    );
                }
            });
        }
    });
    
});


issuesRouter.put('/:issueId', (req, res, next) => {
    const issue = req.body.issue;

    db.get('SELECT * FROM Artist WHERE Artist.id = $artistId', 
        {
            $artistId: issue.artistId
        }, (error, artist) => {
            if (error) {
                next(error);
            } else {
                if (!issue.name || !issue.issueNumber || !issue.publicationDate || !issue.artistId) {
                    return res.status(400).send();
                }

                db.run('UPDATE Issue SET name = $name, issue_number = $issueNumber, publication_date = $publicationDate, artist_id = $artistId WHERE Issue.id = $issueId', 
                    {
                        $name: issue.name,
                        $issueNumber: issue.issueNumber,
                        $publicationDate: issue.publicationDate,
                        $artistId: issue.artistId,
                        $issueId: req.params.issueId
                    },
                    (error) => {
                        if (error) {
                            next(error);
                        } else {
                            db.get (`SELECT * FROM Issue WHERE Issue.id = ${req.params.issueId}`, (error, issue) => {
                                res.status(200).json({ issue: issue })
                            });
                        }
                    }
                )
            }
        }
    )
});

issuesRouter.delete('/:issueId', (req, res, next) => {
    db.run('DELETE FROM Issue WHERE Issue.id = $issueId', 
    {
        $issueId: req.params.issueId
    },
    (error) => {
        if(error) {
            next(error);
        } else {
            res.status(204).send();
        }
    }
    )
});

module.exports = issuesRouter;