const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
const testLoad = require('./routes/load_test')

app.use('/api',testLoad);
const port = 3010;

app.listen(port, '', () => {
    console.log(`Server started at port ${port}`);
})


