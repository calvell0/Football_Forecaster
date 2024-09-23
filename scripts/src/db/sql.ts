//Do a npm i to install all dependencies
//nodemon sql to run script in terminal
const mysql = require('mysql2');

const host = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password:'0000',
    database: 'nfl_data',
    port: 3306
});
const port = 3306;
host.query('CREATE DATABASE IF NOT EXISTS nfl_data', function(err , results){
    if(err) throw err;
    console.log('Database created or already exists on port: ' + port);

});

host.query(`
    CREATE TABLE teams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      wins INT,
      loss INT
    )`, function (err, results) {
    if (err) throw err;
    console.log('Table created:', results);
  });




