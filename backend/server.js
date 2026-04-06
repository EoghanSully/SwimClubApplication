import express from "express" //Express framework for building the server
import cors from "cors" //allows for frontend -> backend requests across different ports/originsimport dotenv from "dotenv" //to read variables from .env file 
import pool from "./config/db.js" //import connection pool    
import dotenv from "dotenv"; //to read variables from .env file
import errorHandler from "./middleware/error.js"; //importing error handling middleware 
import userRoutes from "./features/users/route.js"; //importing user routes
import eventRoutes from "./features/events/routes.js"; //importing event routes
import announcementRoutes from "./features/announcements/routes.js"; //importing announcement routes
import sessionPlanRoutes from "./features/sessionPlans/routes.js"; //importing session plan routes
import teamRoutes from "./features/teams/routes.js"; //importing team routes
import authRoutes from "./features/auth/routes.js"; //importing auth routes
import cookieParser from "cookie-parser"; //middleware to parse cookies from incoming requests
dotenv.config(); //loads environment variables from .env file into process.env  

//ASK ABOUT SINGLE FILE FOR ALL IMPORTS


const app = express(); //creates an instance of the Express application 
const port = process.env.SERVER_PORT || 5500;  //sets port from .env file or defaults to 5500 if not specified  

//Middleware
app.use(cors({
  origin: 'http://127.0.0.1:5500', //allows requests from the frontend origin
  credentials: true                 //allows cookies (JWT) to be sent with requests
}));
app.use(express.json()); //parses Json requests
app.use(cookieParser()); //parses cookies from incoming requests, making them available on req.cookies

//Routes
app.use("/api", authRoutes); //accesses routes in the authRoutes file with the prefix /api/auth (e.g., /api/auth/login)
app.use("/api", userRoutes); //accesses routes in the userRoutes file with the prefix /api (e.g., /api/users)
app.use("/api", eventRoutes); //accesses routes in the eventRoutes file with the prefix /api (e.g., /api/events)
app.use("/api", announcementRoutes); //accesses routes in the announcementRoutes file with the prefix /api (e.g., /api/announcements)
app.use("/api", sessionPlanRoutes); //accesses routes in the sessionPlanRoutes file with the prefix /api (e.g., /api/plans)
app.use("/api", teamRoutes); //accesses routes in the teamRoutes file with the prefix /api (e.g., /api/teams)
//Error handling middleware
app.use(errorHandler); //handles errors thrown in routes and sends appropriate responses  


//Checking Server Running in terminal
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`); 
  
});
