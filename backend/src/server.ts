import express from 'express';
import {pool} from './db/pool.js'
import authRoutes from './routes/auth.js'
import analysesRoutes from './routes/analyses.js';
import sharesRoutes from './routes/shares.js';

const app = express();
const PORT = 3000;

//Parse JSON bodies on incoming requests
app.use(express.json());

//Mount auth routes at /api/auth
app.use('/api/auth', authRoutes);
app.use('/api', analysesRoutes);
app.use('/api', sharesRoutes);

app.get('/', (req, res) =>{
    res.send('CodeMap server is running!');
});

app.get('/db-test', async (req, res) => {
    try{
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err){
      console.error('Query failed:' , err);
      res.status(500).json({error: 'Database query failed'});

    }
});

app.listen(PORT, () =>{
    console.log(`Server running on http://localhost:${PORT}`);
});