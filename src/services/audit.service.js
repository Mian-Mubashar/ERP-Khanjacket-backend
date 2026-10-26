const { AuditLog } = require('../models');

class AuditService {
  /**
   * Log an event into the system audit trail
   */
  static async log({ action, category, details, impact = null, user = null, transaction = null }) {
    try {
      const now = new Date();
      const datePart = now.toISOString().split('T')[0];
      const timePart = now.toTimeString().split(' ')[0].substring(0, 5);
      const timestamp = `${datePart} ${timePart}`;

      const userName = user ? `${user.role} (${user.name})` : 'System';
      const userRole = user ? user.role : 'System';

      const id = `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;

      return await AuditLog.create({
        id,
        timestamp,
        userName,
        userRole,
        action,
        category,
        details,
        impact
      }, { transaction });
    } catch (error) {
      console.error('[AuditService] Failed to record audit log:', error.message);
      // Non-blocking: fail quietly if outside transaction
      return null;
    }
  }

  static async getLogs({ page = 1, limit = 50, category, search }) {
    const { Op } = require('sequelize');
    const where = {};

    if (category && category !== 'ALL') {
      where[Op.or] = [
        { category: { [Op.like]: `%${category}%` } },
        { action: { [Op.like]: `%${category}%` } }
      ];
    }

    if (search) {
      where[Op.or] = [
        { action: { [Op.like]: `%${search}%` } },
        { details: { [Op.like]: `%${search}%` } },
        { userName: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    });

    return { total: count, logs: rows };
  }
}

module.exports = AuditService;
