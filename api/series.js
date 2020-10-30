const express = require('express');
const seriesRouter = express.Router();
const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');
const issuesRouter = require('./issues');

seriesRouter.use('/:seriesId/issues', issuesRouter);

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
    db.get('SELECT * FROM Series WHERE Series.id = $seriesId', 
        {
            $seriesId: seriesId
        },
        (error, series) => {
            if (error) {
                next(error);
            } else if (series) {
                req.series = series;
                next();
            } else {
                res.status(404).send();
            }
        }
    );
});

seriesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Series', (error, series) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json({series: series});
        }
    });
});

seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).json({series: req.series});
});

seriesRouter.post('/', (req, res, next) => {
    const series = req.body.series;
    if (!series.name || !series.description) {
        res.status(400).send();

    } 
    db.run('INSERT INTO Series (name, description) VALUES ($name, $description)',
        {
            $name: series.name,
            $description: series.description
        }, 
        function(error) {
            if (error) {
                next(error);
            } else {
                db.get('SELECT * FROM Series WHERE Series.id = $seriesId', 
                    {
                        $seriesId: this.lastID
                    },
                    (error, series) => {
                        res.status(201).json({series: series});
                    }
                );
            }
        });

});

seriesRouter.put('/:seriesId', (req, res, next) => {
    const series = req.body.series;

    if(!series.name || !series.description) {
        res.status(400).send();
    }

    db.run('UPDATE Series SET name = $name, description = $description WHERE Series.id = $seriesId', 
    {
        $name: series.name,
        $description: series.description,
        $seriesId: req.params.seriesId
    },
    (error, series) => {
        if(error) {
            next(error);
        } else {
            db.get('SELECT * FROM Series WHERE Series.id = $seriesId',
            {
                $seriesId: req.params.seriesId
            },
            (error, series) => {
                res.status(200).json({series: series});
            });
        }
    });
    
});

seriesRouter.delete('/:seriesId', (req, res, next) => {
    db.get('SELECT * FROM Issue WHERE Issue.series_id = $seriesId', 
        {
            $seriesId: req.params.seriesId
        },
        (error, issue) => {
            if (error) {
                next(error);
            } else if (issue) {
                res.sendStatus(400);
            } else {
                db.run('DELETE FROM Series WHERE Series.id = $seriesId',
                {
                    $seriesId: req.params.seriesId
                }, 
                (error) => {
                    if (error) {
                        next (error);
                    } else {
                        res.sendStatus(204);
                    }
                });  
            }              
        }
    )
});

module.exports = seriesRouter;