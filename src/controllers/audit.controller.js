const AuditService = require('../services/audit.service');
const ApiResponse = require('../utils/apiResponse');

class AuditController {
  static async list(req, res, next) {
    try {
      const { page, limit, category, search } = req.query;
      const result = await AuditService.getLogs({ page, limit, category, search });
      return ApiResponse.paginated(
        res,
        result.logs,
        result.total,
        page || 1,
        limit || 50,
        'Audit logs retrieved'
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuditController;
