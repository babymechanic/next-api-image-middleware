import { Readable } from 'stream';
import busboy from 'busboy';
import { Opts, UploadedFile } from './multi-part-definitions';
import sharp from 'sharp';

export function createFileFromStream(stream: Readable, outputBuffer: Promise<Buffer>, info: busboy.FileInfo, fieldName: string): Promise<UploadedFile> {
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


export function createSharpStream(info: busboy.FileInfo, opts: Opts): sharp.Sharp | null {
  const mimeType = opts.mimeTypes[info.mimeType];
  return mimeType?.sharpStream();
}

