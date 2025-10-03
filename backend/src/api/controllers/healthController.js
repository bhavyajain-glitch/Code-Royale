// This controller handles the health check logic.

const checkHealth = (req, res) => {
    // A simple health check response.
    res.status(200).json({ status: 'ok', message: 'Server is healthy' });
  };
  
  module.exports = {
    checkHealth,
  };