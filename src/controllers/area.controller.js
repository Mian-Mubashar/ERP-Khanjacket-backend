const { Area, City, Customer } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const AuditService = require('../services/audit.service');

class AreaController {
  static async list(req, res, next) {
    try {
      const { cityName } = req.query;
      const where = {};
      if (cityName && cityName !== 'ALL') {
        where.cityName = cityName;
      }
      const areas = await Area.findAll({
        where,
        order: [['cityName', 'ASC'], ['name', 'ASC']]
      });
      return ApiResponse.success(res, areas, 'Areas retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { name, cityName, cityId } = req.body;
      if (!name || !name.trim()) {
        throw ApiError.badRequest('Area name is required');
      }
      if (!cityName || !cityName.trim()) {
        throw ApiError.badRequest('City name is required');
      }

      const trimmedName = name.trim();
      const trimmedCity = cityName.trim();

      const existing = await Area.findOne({
        where: { name: trimmedName, cityName: trimmedCity }
      });
      if (existing) {
        return ApiResponse.success(res, existing, 'Area already exists');
      }

      const area = await Area.create({
        name: trimmedName,
        cityName: trimmedCity,
        cityId: cityId || null
      });

      await AuditService.log({
        action: 'Area Added',
        category: 'Branches & Areas',
        details: `Added area "${trimmedName}" to city "${trimmedCity}"`,
        impact: `Area ID: ${area.id}`,
        user: req.user
      });

      return ApiResponse.created(res, area, 'Area created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const area = await Area.findByPk(id);
      if (!area) {
        throw ApiError.notFound('Area not found');
      }

      const areaName = area.name;
      const cityName = area.cityName;

      await area.destroy();

      await AuditService.log({
        action: 'Area Deleted',
        category: 'Branches & Areas',
        details: `Deleted area "${areaName}" from city "${cityName}"`,
        impact: 'Removed from area list',
        user: req.user
      });

      return ApiResponse.success(res, null, 'Area deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AreaController;

