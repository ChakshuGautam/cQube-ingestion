const router = require('express').Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const { Client } = require('pg')
const { parse } = require('@fast-csv/parse');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'test',
  password: 'password',
  port: 5432,
})

router.post('/loadFile', async (req, res) => {
  try {
    const pgp = require('pg-promise')({
      capSQL: true // generate capitalized SQL 
    });

    const db = pgp({
      user: 'postgres',
      host: 'localhost',
      database: 'test',
      password: 'password',
      port: 5432,
    });
    const cs = new pgp.helpers.ColumnSet([
      'id', 'date', 'school_id', 'grade', 'count', 'sum', 'percentage'
    ], { table: 'event_1' });

    let stream = fs.createReadStream("./student_attendance.csv", { autoClose: true });
    let row = []
    console.log("Start Sync time @ ::: " + new Date().toLocaleString());
    let fileStream = stream
      .pipe(parse({ headers: true }))
      .on("data", function (data) {
        row.push(data);
        if (row.length === 1000) {
          fileStream.pause()
          db.tx('inserting-events', t => {
            const insert = pgp.helpers.insert(row, cs)
            t.none(insert).then(() => {
              row = []
              fileStream.resume()
            })
          })
        }
      })
      .on('end', () => {
        console.log("End Sync time @ ::: " + new Date().toLocaleString());
        console.log('saved into db!!!!');
        res.send('success!!!!!!!!')
      })
  } catch (error) {
    console.log(error);
  }
})

router.post('/generateData', async function (req, res) {
  console.log("Starttime to Sync to file @ ::: " + new Date().toLocaleString());
  const writeUsers = fs.createWriteStream('student_attendance.csv');
  writeUsers.write('id,date,school_id,grade,count,sum,percentage\n', 'utf8');
  writeTenMillionUsers(writeUsers, 'utf-8', () => {
    writeUsers.end();
    console.log("End-time Sync to file @ ::: " + new Date().toLocaleString());
    console.log('File Saved!')
    res.send('file saved')
  });
})

function writeTenMillionUsers(writer, encoding, callback) {
  let i = 30000000;
  let id = 0;
  const timeElapsed = Date.now();
  const today = new Date(timeElapsed);
  function write() {
    let ok = true;
    do {
      i -= 1;
      id += 1;
      const data = `${id},${today.toLocaleDateString()},${Math.floor(Math.random() * (1000 - 1 + 1)) + 1},${Math.floor(Math.random() * (12 - 0 + 1)) + 0},${Math.floor(Math.random() * (30 - 1 + 1)) + 1},${Math.floor(Math.random() * (1000 - 1 + 1)) + 1},${Math.floor(Math.random() * (100.0 - 0.0 + 1)) + 0.0}\n`
      if (i === 0) {
        writer.write(data, encoding, callback);
      } else {
        // see if we should continue, or wait
        // don't pass the callback, because we're not done yet.
        ok = writer.write(data, encoding);
      }
    } while (i > 0 && ok);
    if (i > 0) {
      // had to stop early!
      // write some more once it drains
      writer.once('drain', write);
    }
  }
  write()
}

module.exports = router;
