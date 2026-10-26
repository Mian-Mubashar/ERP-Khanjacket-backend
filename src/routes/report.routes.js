const express = require('express');
const ReportController = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', ReportController.getDashboardMetrics);

module.exports = router;
