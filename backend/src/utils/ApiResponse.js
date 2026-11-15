class ApiResponse {
  /**
   * Send a success response
   * @param {import('express').Response} res
   * @param {*} data - Response payload
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default 200)
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      ...(data !== null && data !== undefined && { data }),
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send an error response
   * @param {import('express').Response} res
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default 500)
   * @param {Array} errors - Array of detailed error info
   */
  static error(res, message = 'Something went wrong', statusCode = 500, errors = []) {
    const response = {
      success: false,
      message,
      ...(errors.length > 0 && { errors }),
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send a paginated success response
   * @param {import('express').Response} res
   * @param {*} data - Response payload (rows)
   * @param {object} pagination - { page, limit, total, totalPages }
   * @param {string} message
   */
  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    });
  }
}

export default ApiResponse;
