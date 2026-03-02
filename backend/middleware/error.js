//centralized error handling

const errorHandler = (err, req, res, next) => {
    console.error(err.stack); //logs error stack trace to console
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ error: "Invalid JSON payload" });
    }

    const status = err.status || 500;
    res.status(status).json({ error: `Error in ${err.message}` }); //sends generic error response to client
} 
export default errorHandler;    