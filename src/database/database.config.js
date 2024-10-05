
const mssql = require("mssql");
const dotenv =require('dotenv')
dotenv.config();

const config = {
    server: '97.74.83.13',
    // database: 'prod-shatechnosolutions',
    // user: 'shatechno-proddev', 
    // password: 'gXM5KMeAx',
    database: 'dev.shatechno',
    user: 'dev.shatechno', 
    password: '7!jYo787n',
    options: {
        trustedConnection: false,
        enableArithAbort: true,
        encrypt: false, 
        trustServerCertificate: true,

    }
}

module.exports = config;