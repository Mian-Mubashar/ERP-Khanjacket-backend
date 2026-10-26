const ArticleService = require('../services/article.service');
const ApiResponse = require('../utils/apiResponse');

class ArticleController {
  static async list(req, res, next) {
    try {
      const articles = await ArticleService.listArticles(req.query);
      return ApiResponse.success(res, articles, 'Articles retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req, res, next) {
    try {
      const article = await ArticleService.getArticleDetails(req.params.articleNo);
      return ApiResponse.success(res, article, 'Article details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const article = await ArticleService.createArticle(req.body, req.user);
      return ApiResponse.created(res, article, 'Article created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const article = await ArticleService.updateArticle(req.params.articleNo, req.body, req.user);
      return ApiResponse.success(res, article, 'Article updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await ArticleService.deleteArticle(req.params.articleNo, req.user);
      return ApiResponse.success(res, result, 'Article deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ArticleController;
