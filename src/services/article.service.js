const { Article, PurchaseItem, Outward } = require('../models');
const ApiError = require('../utils/apiError');
const AuditService = require('./audit.service');

class ArticleService {
  /**
   * List all articles with optional filtering and search
   */
  static async listArticles({ category, stuff, search, lowStockOnly }) {
    const { Op } = require('sequelize');
    const where = {};

    if (category) {
      where.category = category;
    }

    if (stuff) {
      where.stuff = stuff;
    }

    if (search) {
      where[Op.or] = [
        { articleNo: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } },
        { stuff: { [Op.like]: `%${search}%` } },
        { warehouseLocation: { [Op.like]: `%${search}%` } }
      ];
    }

    if (lowStockOnly === 'true' || lowStockOnly === true) {
      where[Op.and] = [
        require('sequelize').literal('currentStock <= minAlertStock')
      ];
    }

    return await Article.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Get single article details with its recent movements
   */
  static async getArticleDetails(articleNo) {
    const article = await Article.findByPk(articleNo.toUpperCase(), {
      include: [
        {
          model: PurchaseItem,
          as: 'purchaseItems',
          limit: 10,
          order: [['createdAt', 'DESC']]
        },
        {
          model: Outward,
          as: 'outwardDispatches',
          limit: 10,
          order: [['date', 'DESC']]
        }
      ]
    });

    if (!article) {
      throw ApiError.notFound(`Article with code "${articleNo}" not found`);
    }

    return article;
  }

  /**
   * Create new article (Strictly NO size, NO color fields)
   */
  static async createArticle(articleData, currentUser) {
    const formattedCode = articleData.articleNo.trim().toUpperCase();

    const exists = await Article.findByPk(formattedCode);
    if (exists) {
      throw ApiError.conflict(`Article code "${formattedCode}" already exists`);
    }

    const initialStock = Number(articleData.initialStock) || 0;
    const unitCost = Number(articleData.unitCost) || 0;

    const newArticle = await Article.create({
      articleNo: formattedCode,
      name: articleData.name.trim(),
      category: articleData.category,
      stuff: articleData.stuff || 'Parachute (Waterproof)',
      totalPurchased: initialStock,
      totalOut: 0,
      currentStock: initialStock,
      unitCost,
      minAlertStock: Number(articleData.minAlertStock) || 100,
      description: articleData.description || '',
      warehouseLocation: articleData.warehouseLocation?.trim() || 'Main Godown - Hall A'
    });

    await AuditService.log({
      action: 'New Article Created',
      category: 'Article Record',
      details: `Created Article ${formattedCode} - ${newArticle.name} (${newArticle.category}, ${newArticle.stuff}) @ Location: ${newArticle.warehouseLocation}`,
      impact: `Initial stock set to ${newArticle.currentStock} pcs @ Rs. ${newArticle.unitCost}`,
      user: currentUser
    });

    return newArticle;
  }

  /**
   * Update article details
   */
  static async updateArticle(articleNo, updateData, currentUser) {
    const article = await Article.findByPk(articleNo.toUpperCase());
    if (!article) {
      throw ApiError.notFound(`Article "${articleNo}" not found`);
    }

    await article.update(updateData);

    await AuditService.log({
      action: 'Article Updated',
      category: 'Article Record',
      details: `Updated details for Article ${articleNo}`,
      impact: `Updated by ${currentUser?.name || 'Admin'}`,
      user: currentUser
    });

    return article;
  }

  /**
   * Delete article
   */
  static async deleteArticle(articleNo, currentUser) {
    const formattedCode = (articleNo || '').trim().toUpperCase();
    const article = await Article.findByPk(formattedCode);
    if (!article) {
      throw ApiError.notFound(`Article "${articleNo}" not found`);
    }

    // Check if article is used in outward dispatches
    const outwardCount = await Outward.count({ where: { articleNo: formattedCode } });
    if (outwardCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete Article "${formattedCode}" because it is linked to ${outwardCount} outward dispatch(es). Delete or adjust those outward bills first.`
      );
    }

    // Check if article is used in China purchase bills
    const purchaseCount = await PurchaseItem.count({ where: { articleNo: formattedCode } });
    if (purchaseCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete Article "${formattedCode}" because it is linked to ${purchaseCount} purchase record(s).`
      );
    }

    await article.destroy();

    await AuditService.log({
      action: 'Article Deleted',
      category: 'Article Record',
      details: `Deleted Article ${formattedCode} - ${article.name}`,
      impact: `Stock of ${article.currentStock} pcs removed from warehouse catalog`,
      user: currentUser
    });

    return { message: `Article ${formattedCode} deleted successfully` };
  }
}

module.exports = ArticleService;
