const bodyParser = require('body-parser');
const cors = require('cors');
const errorHandler = require('errorhandler');
const morgan = require('morgan');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));
app.use(express.static('public'));

const apiRouter = require('./api/api')
app.use('/api', apiRouter);

if (process.env.NODE_ENV === 'development') {
    // only use in development
    app.use(errorhandler({log: errorNotification}))
}

function errorNotification (err, string, req) {
    var title = 'Error in ' + req.method + ' ' + req.url
   
    notifier.notify({
      title: title,
      message: string
    });
}

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

module.exports = app;