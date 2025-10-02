/**
 * QR Code Generator Utility
 * Generates QR codes for affiliate links
 */

import QRCode from 'qrcode';
import { logger } from './logger';

export class QRGenerator {
  /**
   * Generate QR code as buffer (for Telegram)
   */
  static async generateBuffer(text: string): Promise<Buffer> {
    try {
      const buffer = await QRCode.toBuffer(text, {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
      
      logger.debug(`QR code generated for: ${text.substring(0, 30)}...`);
      return buffer;
    } catch (error) {
      logger.error('QR code generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate QR code as data URL (for web/HTML)
   */
  static async generateDataURL(text: string): Promise<string> {
    try {
      const dataURL = await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
      
      return dataURL;
    } catch (error) {
      logger.error('QR code data URL generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate QR code and save to file
   */
  static async generateFile(text: string, filePath: string): Promise<void> {
    try {
      await QRCode.toFile(filePath, text, {
        type: 'png',
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
      
      logger.info(`QR code saved to: ${filePath}`);
    } catch (error) {
      logger.error('QR code file generation failed:', error);
      throw error;
    }
  }
}

