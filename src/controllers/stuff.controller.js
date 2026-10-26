const { Stuff, Category, Article } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const AuditService = require('../services/audit.service');

class StuffController {
  static async list(req, res, next) {
    try {
      const stuffs = await Stuff.findAll({ order: [['name', 'ASC']] });
      return ApiResponse.success(res, stuffs.map(s => s.name), 'Stuffs retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        throw ApiError.badRequest('Stuff / fabric name is required');
      }

      const trimmed = name.trim();
      const existing = await Stuff.findOne({ where: { name: trimmed } });
      if (existing) {
        throw ApiError.conflict('Stuff / fabric already exists');
      }

      const stuff = await Stuff.create({ name: trimmed });

      await AuditService.log({
        action: 'Jacket Stuff Added',
        category: 'Garment Stuffs',
        details: `Added fabric: ${trimmed}`,
        impact: 'Available in article catalog',
        user: req.user
      });

      return ApiResponse.created(res, stuff.name, 'Stuff / fabric added');
    } catch (error) {
      next(error);
    }
  }

  // Categories helper
  static async listCategories(req, res, next) {
    try {
      const categories = await Category.findAll({ order: [['name', 'ASC']] });
      return ApiResponse.success(res, categories.map(c => c.name), 'Categories retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req, res, next) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        throw ApiError.badRequest('Category name is required');
      }

      const trimmed = name.trim();
      const existing = await Category.findOne({ where: { name: trimmed } });
      if (existing) {
        throw ApiError.conflict('Category already exists');
      }

      const category = await Category.create({ name: trimmed });

      await AuditService.log({
        action: 'Category Added',
        category: 'Categories',
        details: `Added category: ${trimmed}`,
        impact: 'Available in article catalog',
        user: req.user
      });

      return ApiResponse.created(res, category.name, 'Category added');
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req, res, next) {
    try {
      const { name } = req.params;
      const { newName } = req.body;
      if (!newName || !newName.trim()) {
        throw ApiError.badRequest('New category name is required');
      }

      const oldName = decodeURIComponent(name).trim();
      const updatedName = newName.trim();

      const category = await Category.findOne({ where: { name: oldName } });
      if (!category) {
        throw ApiError.notFound(`Category "${oldName}" not found`);
      }

      if (updatedName.toLowerCase() !== oldName.toLowerCase()) {
        const existing = await Category.findOne({ where: { name: updatedName } });
        if (existing) {
          throw ApiError.conflict(`Category "${updatedName}" already exists`);
        }
      }

      category.name = updatedName;
      await category.save();

      // Automatically update articles matching old category name
      await Article.update({ category: updatedName }, { where: { category: oldName } });

      await AuditService.log({
        action: 'Category Renamed',
        category: 'Categories',
        details: `Renamed category from "${oldName}" to "${updatedName}"`,
        impact: 'Updated category in database',
        user: req.user
      });

      return ApiResponse.success(res, category.name, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req, res, next) {
    try {
      const { name } = req.params;
      const categoryName = decodeURIComponent(name).trim();

      const category = await Category.findOne({ where: { name: categoryName } });
      if (!category) {
        throw ApiError.notFound(`Category "${categoryName}" not found`);
      }

      await category.destroy();

      await AuditService.log({
        action: 'Category Deleted',
        category: 'Categories',
        details: `Deleted category "${categoryName}"`,
        impact: 'Removed from database',
        user: req.user
      });

      return ApiResponse.success(res, null, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = StuffController;
