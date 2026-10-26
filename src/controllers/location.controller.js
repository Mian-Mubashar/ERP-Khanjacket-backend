const { WarehouseLocation } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const AuditService = require('../services/audit.service');

class LocationController {
  static async list(req, res, next) {
    try {
      const locations = await WarehouseLocation.findAll({ order: [['name', 'ASC']] });
      return ApiResponse.success(res, locations.map(l => l.name), 'Warehouse locations retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { name, type, description } = req.body;
      if (!name || !name.trim()) {
        throw ApiError.badRequest('Location / Rack name is required (e.g. Hall A - Rack 01, Godown 2)');
      }

      const trimmed = name.trim();
      const existing = await WarehouseLocation.findOne({ where: { name: trimmed } });
      if (existing) {
        throw ApiError.conflict(`Location "${trimmed}" already exists`);
      }

      const loc = await WarehouseLocation.create({
        name: trimmed,
        type: type || 'Rack',
        description: description?.trim() || null
      });

      await AuditService.log({
        action: 'Warehouse Location Added',
        category: 'Inventory Racks',
        details: `Added new warehouse location: ${trimmed}`,
        impact: 'Available in article catalog',
        user: req.user
      });

      return ApiResponse.created(res, loc.name, 'Warehouse location added');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { name } = req.params;
      const loc = await WarehouseLocation.findOne({ where: { name } });
      if (!loc) {
        throw ApiError.notFound('Location not found');
      }
      await loc.destroy();
      return ApiResponse.success(res, null, 'Location deleted');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LocationController;
