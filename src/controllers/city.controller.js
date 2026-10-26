const { City, Customer } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const AuditService = require('../services/audit.service');

class CityController {
  static async list(req, res, next) {
    try {
      const cities = await City.findAll({ order: [['id', 'ASC']] });
      return ApiResponse.success(res, cities, 'Cities retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        throw ApiError.badRequest('City branch name is required');
      }

      const trimmed = name.trim();
      const existing = await City.findOne({ where: { name: trimmed } });
      if (existing) {
        throw ApiError.conflict('City already exists in branches list');
      }

      const city = await City.create({
        name: trimmed,
        totalShops: 0,
        totalMalSent: 0
      });

      await AuditService.log({
        action: 'Branch / City Added',
        category: 'Branches',
        details: `Added city branch: ${trimmed}`,
        impact: `Branch ID: ${city.id}`,
        user: req.user
      });

      return ApiResponse.created(res, city, 'City branch added');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name || !name.trim()) {
        throw ApiError.badRequest('City branch name is required');
      }

      const city = await City.findByPk(id);
      if (!city) {
        throw ApiError.notFound('City branch not found');
      }

      const oldName = city.name;
      city.name = name.trim();
      await city.save();

      await AuditService.log({
        action: 'Branch / City Updated',
        category: 'Branches',
        details: `Renamed city ID ${id} from "${oldName}" to "${city.name}"`,
        impact: 'Updated',
        user: req.user
      });

      return ApiResponse.success(res, city, 'City updated');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const city = await City.findByPk(id);
      if (!city) {
        throw ApiError.notFound('City branch not found');
      }

      // Check if any customer belongs to this city
      const customerCount = await Customer.count({ where: { city: city.name } });
      if (customerCount > 0) {
        throw ApiError.badRequest(`Cannot delete city "${city.name}". ${customerCount} shopkeepers are registered under this city.`);
      }

      await city.destroy();

      await AuditService.log({
        action: 'Branch / City Deleted',
        category: 'Branches',
        details: `Deleted city branch: ${city.name}`,
        impact: 'Removed from branch list',
        user: req.user
      });

      return ApiResponse.success(res, null, 'City deleted');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CityController;
