/**
 * File Upload Service Tests
 */

import { FileUploadService } from '../services/file-upload.service';
import fs from 'fs';
import path from 'path';

// Mock fs module
jest.mock('fs');

describe('FileUploadService', () => {
  let uploadService: FileUploadService;
  const testUploadDir = './test-uploads/products';

  beforeEach(() => {
    uploadService = new FileUploadService(testUploadDir);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create upload directory if it does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});

      new FileUploadService(testUploadDir);

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        path.resolve(testUploadDir),
        { recursive: true }
      );
    });
  });

  describe('getFileInfo', () => {
    it('should return file info if file exists', () => {
      const filename = 'test-image.jpg';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 });

      const result = uploadService.getFileInfo(filename);

      expect(result.exists).toBe(true);
      expect(result.size).toBe(1024);
      expect(result.path).toContain(filename);
    });

    it('should return exists: false if file does not exist', () => {
      const filename = 'nonexistent.jpg';
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = uploadService.getFileInfo(filename);

      expect(result.exists).toBe(false);
      expect(result.size).toBeUndefined();
      expect(result.path).toBeUndefined();
    });
  });

  describe('deleteFile', () => {
    it('should delete file if it exists', async () => {
      const filename = 'test-image.jpg';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

      await uploadService.deleteFile(filename);

      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining(filename)
      );
    });

    it('should not throw error if file does not exist', async () => {
      const filename = 'nonexistent.jpg';
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(uploadService.deleteFile(filename)).resolves.not.toThrow();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('deleteFiles', () => {
    it('should delete multiple files', async () => {
      const filenames = ['file1.jpg', 'file2.jpg'];
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

      await uploadService.deleteFiles(filenames);

      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
    });

    it('should continue deleting files even if one fails', async () => {
      const filenames = ['file1.jpg', 'file2.jpg'];
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock)
        .mockImplementationOnce(() => { throw new Error('Delete failed'); })
        .mockImplementationOnce(() => {});

      await uploadService.deleteFiles(filenames);

      // Should have attempted both deletes
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
    });
  });
});
