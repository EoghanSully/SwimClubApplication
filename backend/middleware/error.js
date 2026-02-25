//centralized error handling

const errorHandler = (err, req, res, next) => {
    console.error(err.stack); //logs error stack trace to console
    res.status(500).json({ error: `Error in ${err.message}` }); //sends generic error response to client
} 
export default errorHandler;    