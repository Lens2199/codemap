import express from 'express';
import {pool} from './db/pool.js'

const app = express();
const PORT = 3000;

app.get('/', (req, res) =>{
    res.send('CodeMap server is running!');
});

app.get('/db-test', async (req, res) => {
    try{
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err){
      console.log('Query failed:' , err);
      res.status(500).json({error: 'Database query failed'});

    }
});

app.listen(PORT, () =>{
    console.log(`Server running on http://localhost:${PORT}`);
});