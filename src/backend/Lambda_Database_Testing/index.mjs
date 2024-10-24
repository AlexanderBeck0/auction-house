import mysql from 'mysql';

export const handler = async (event) => {
    console.log('Creating MySQL pool...');
    var pool = mysql.createPool({
        host: "auctionhousedb.chyqe6cmmf08.us-east-1.rds.amazonaws.com",
        user: "auctionadmin",
        password: "sp6dO9CPdNecytAhsnQm",
        database: "auctionhouse"
    });

    const tableName = event.tableName;
    console.log('Received tableName:', tableName, 'Type:', typeof tableName);

    return new Promise((resolve, reject) => {
        if (typeof tableName !== 'string') {
            const error = new Error('Invalid tableName parameter. Expected a string.');
            console.error(error);
            return reject(error);
        }

        const query = `SELECT * FROM ${mysql.escapeId(tableName)}`;
        console.log('Executing query:', query);
        pool.query(query, (error, results) => {
            if (error) {
                console.error('Query error:', error);
                reject(error);
            } else {
                console.log('Query results:', results);
                resolve({
                    statusCode: 200,
                    body: JSON.stringify(results),
                });
            }
        });
    });
};