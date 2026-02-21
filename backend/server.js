import express from "express" //Express framework for building the server
import cors from "cors" //allows for frontend -> backend requests across different ports/origins
import dotenv from "dotenv" //to read variables from .env file 
import pool from "./config/db.js" //import connection pool    

dotenv.config();

const app = express();
const port = process.env.SERVER_PORT || 5000;  

//Middleware
app.use(cors());
app.use(express.json()); //parses Json requests

//Routes
//Using Thunder Client to test routes; based page display
app.get('/', (req, res) => {
  res.send('Welcome to the Swim Club!');
}   );  

//Error handling middleware


//Testing pool conncetion and retrieval of user data (with ThunderClient)
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = 2'); //query to test connection 
    res.send({ message: 'Database connection confirmed ', result:  result.rows[0] }); //should return user information in thunderclient 
    console.log("Database retrieval:", result.rows[0]); //displays result in terminal console
  } catch (err) {
    console.error("Error testing database connection:", err);
    res.status(500).json({ error: "Failed to test database connection" });
  }
}); 

//Checking Server Running in terminal
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});