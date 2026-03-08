const handleResponse = (res, status,message, data = null) => {  //standardized response function
    res.status(status).json({status, message, data }); //sends JSON response with status, message, and optional data
};
//to be used in controllers to send consistent responses to the frontend
export default handleResponse;