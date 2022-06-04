import { Readable } from 'stream';
import busboy from 'busboy';
import { Opts, UploadedFile, UploadedFileError } from './multi-part-definitions';
import sharp from 'sharp';

function createError(info: busboy.FileInfo, fieldName: string): UploadedFileError {
  return {...info, fieldName, status: 'Limit exceeded'};
}

function createSuccess(info: busboy.FileInfo, fieldName: string, buffer: Buffer): UploadedFile {
  return {...info, fieldName, status: 'Success', fileContent: buffer};
}

function isErrorBecauseOfLimitExceeded(limitExceeded: boolean, e: any) {
  return limitExceeded && e.message?.includes('VipsJpeg: Premature end of input file');
}

export function createFileFromStream(stream: Readable, outputBuffer: Promise<Buffer>, info: busboy.FileInfo, fieldName: string): Promise<UploadedFileError | UploadedFile> {
  return new Promise<UploadedFileError | UploadedFile>((resolve, reject) => {
    let limitExceeded = false;

    stream.on('limit', () => {
      limitExceeded = true;
    });

    stream.on('close', () => {
      outputBuffer.then((buffer) => limitExceeded ? createError(info, fieldName) : createSuccess(info, fieldName, buffer))
                  .then((result) => resolve(result))
                  .catch((e) => {
                    if (isErrorBecauseOfLimitExceeded(limitExceeded, e)) {
                      resolve(createError(info, fieldName));
                    } else {
                      reject(e);
                    }
                  })
    });

    stream.on('error', err => {
      reject(err);
    })
  });
}


export function createSharpBuffer(info: busboy.FileInfo, sharpStream: sharp.Sharp, opts: Opts): Promise<Buffer> | undefined {
  const mimeType = opts.mimeTypes[info.mimeType];
  return mimeType?.applyManipulations(sharpStream)?.toBuffer();
}

