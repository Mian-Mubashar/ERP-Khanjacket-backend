const DeviceService = require('../services/device.service');
const ApiResponse = require('../utils/apiResponse');

class DeviceController {
  static async list(req, res, next) {
    try {
      const devices = await DeviceService.listDevices();
      return ApiResponse.success(res, devices, 'Authorized devices retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const device = await DeviceService.addDevice(req.body, req.user);
      return ApiResponse.created(res, device, 'Device authorized successfully');
    } catch (error) {
      next(error);
    }
  }

  static async toggle(req, res, next) {
    try {
      const device = await DeviceService.toggleDeviceStatus(req.params.id, req.user);
      return ApiResponse.success(res, device, `Device access status changed to "${device.status}"`);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await DeviceService.deleteDevice(req.params.id, req.user);
      return ApiResponse.success(res, result, 'Device removed from registry');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DeviceController;
