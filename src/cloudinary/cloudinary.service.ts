import { Injectable } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      if (!file || !file.buffer) {
        return reject(new Error('No file buffer provided'));
      }

      const uploadStream = v2.uploader.upload_stream(
        (
          error: UploadApiErrorResponse | undefined,
          result?: UploadApiResponse,
        ) => {
          if (error) return reject(new Error(error.message));
          if (!result)
            return reject(new Error('Upload failed, no result returned.'));
          resolve(result);
        },
      );

      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }
}
