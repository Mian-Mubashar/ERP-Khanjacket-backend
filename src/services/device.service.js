const { Device } = require('../models');
const config = require('../config/env');
const ApiError = require('../utils/apiError');
const AuditService = require('./audit.service');

class DeviceService {
  /**
   * List all registered devices
   */
  static async listDevices() {
    return await Device.findAll({
      order: [['createdAt', 'ASC']]
    });
  }

  /**
   * Authorize a new mobile device
   * Enforces Khan Clothes strict warehouse rule: 4-5 hardware mobile devices maximum
   */
  static async addDevice(deviceData, currentUser) {
    const totalAuthorized = await Device.count({ where: { status: 'Authorized' } });
    const maxLimit = config.security.maxAuthorizedDevices;

    if (totalAuthorized >= maxLimit) {
      throw ApiError.badRequest(
        `Hardware Authorization Limit Reached! Maximum ${maxLimit} mobile phones are permitted per Khan Clothes security policy. Revoke an unused mobile before registering a new one.`
      );
    }

    const devices = await Device.findAll({ attributes: ['id'] });
    let maxNum = 0;
    devices.forEach(d => {
      const match = String(d.id).match(/^DEV-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    let newId = `DEV-${maxNum + 1}`;
    while (await Device.findByPk(newId)) {
      maxNum++;
      newId = `DEV-${maxNum + 1}`;
    }
    const ipAddress = `182.180.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;

    const newDevice = await Device.create({
      id: newId,
      deviceName: deviceData.deviceName.trim(),
      model: deviceData.model?.trim() || 'Smart Mobile Device',
      owner: deviceData.owner.trim(),
      location: deviceData.location?.trim() || 'Karachi Central Warehouse',
      ipAddress,
      lastActive: 'Just Now',
      status: 'Authorized',
      isCurrent: false,
      addedOn: new Date().toISOString().split('T')[0]
    });

    await AuditService.log({
      action: 'New Device Authorized',
      category: 'Security & Access',
      details: `Authorized mobile "${newDevice.deviceName}" (${newDevice.model}) for staff member "${newDevice.owner}"`,
      impact: `Hardware units authorized: ${totalAuthorized + 1} / ${maxLimit}`,
      user: currentUser
    });

    return newDevice;
  }

  /**
   * Toggle device status (Authorized <-> Revoked)
   */
  static async toggleDeviceStatus(deviceId, currentUser) {
    const device = await Device.findByPk(deviceId);
    if (!device) {
      throw ApiError.notFound(`Device with ID "${deviceId}" not found`);
    }

    const newStatus = device.status === 'Authorized' ? 'Revoked' : 'Authorized';

    // If re-authorizing, check limit
    if (newStatus === 'Authorized') {
      const activeCount = await Device.count({ where: { status: 'Authorized' } });
      if (activeCount >= config.security.maxAuthorizedDevices) {
        throw ApiError.badRequest(
          `Cannot authorize device. Maximum limit of ${config.security.maxAuthorizedDevices} active hardware units reached.`
        );
      }
    }

    device.status = newStatus;
    await device.save();

    await AuditService.log({
      action: `Device ${newStatus}`,
      category: 'Security & Access',
      details: `${newStatus} access for hardware unit: ${device.deviceName} (${device.model})`,
      impact: `Immediate ${newStatus.toLowerCase()} of warehouse database access for this mobile`,
      user: currentUser
    });

    return device;
  }

  /**
   * Delete device
   */
  static async deleteDevice(deviceId, currentUser) {
    const device = await Device.findByPk(deviceId);
    if (!device) {
      throw ApiError.notFound(`Device with ID "${deviceId}" not found`);
    }

    await device.destroy();

    await AuditService.log({
      action: 'Device Removed',
      category: 'Security & Access',
      details: `Permanently removed hardware unit ${device.deviceName} (${deviceId}) from device registry`,
      impact: 'Unit unregistered',
      user: currentUser
    });

    return { message: `Device ${deviceId} removed successfully` };
  }
}

module.exports = DeviceService;
