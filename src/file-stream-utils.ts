import { Readable } from 'stream';
import busboy from 'busboy';
import { gifMimeType, UploadedFile, jpegMimeType, Opts, pngMimeType, webpMimeType } from './multi-part-definitions';
import sharp from 'sharp';

export function createFileFromStream(stream: Readable, outputBuffer: Promise<Buffer> | null, info: busboy.FileInfo, fieldName: string): Promise<UploadedFile> {

  if (outputBuffer == null) {
    stream.resume();
    console.warn(`Ignoring field ${fieldName} with file name ${info.filename} because of invalid mime type ${info.mimeType}`);
    return Promise.resolve({fieldName, invalidMime: true, ...info});
  }

  return new Promise<UploadedFile>((resolve) => {
    let limitExceeded = false;

    stream.on('limit', () => {
      limitExceeded = true;
    });

    stream.on('close', () => {
      outputBuffer.then((buffer) => ({...info, fileContent: buffer, fieldName, limitExceeded}))
                  .then((file) => resolve(file));
    });
  });
}

export function createOutputBuffer(info: busboy.FileInfo, sharpStream: sharp.Sharp, opts: Opts): Promise<Buffer> | null {
  const {fit, height, width} = opts;
  const resized = sharpStream.resize({fit: fit, height: height, width: width});
  if (info.mimeType === jpegMimeType) return resized.jpeg({quality: 80}).toBuffer();
  if (info.mimeType === pngMimeType) return resized.png({quality: 80}).toBuffer();
  if (info.mimeType === gifMimeType) return resized.gif().toBuffer();
  if (info.mimeType === webpMimeType) return resized.webp({quality: 80}).toBuffer();
  return null;
}
