import { ApiRouteHandler, PerRequestContext } from 'next-middle-api';
import { NextApiRequest, NextApiResponse } from 'next';
import busboy, { FileInfo } from 'busboy';
import { Readable } from 'stream';
import { MultiPartParserResults, Opts, UPLOADED_FILES_RESULT_KEY, UploadedFile } from './multi-part-definitions';
import { createFileFromStream, createSharpStream } from './file-stream-utils';
import { IncomingHttpHeaders } from 'http';


function processFiles(headers: IncomingHttpHeaders, opts: Opts, req: NextApiRequest) {
  const {limits} = opts;

  return new Promise<MultiPartParserResults>((resolve, reject) => {

    const bb = busboy({headers: headers, limits: limits});
    const allFilePromises: Promise<UploadedFile>[] = [];
    let busboyError: unknown;
    let validationError: string | undefined;

    const setValidationError = (error: string) => {
      if (validationError != null) return;
      validationError = error;
    };


    bb.on('partsLimit', () => setValidationError('parts limit exceeded!'));
    bb.on('fieldsLimit', () => setValidationError('fields limit exceeded!'));
    bb.on('filesLimit', () => setValidationError('files limit exceeded!'));
    bb.on('field', (fieldName, val) => console.warn(`ignoring field [${fieldName}]: value: %j`, val));
    bb.on('error', (error) => busboyError = error);


    bb.on('file', (fieldName: string, stream: Readable, info: FileInfo) => {
      if (validationError != null) return stream.resume();
      const sharpStream = createSharpStream(info, opts);
      if (sharpStream == null) {
        stream.resume();
        allFilePromises.push(Promise.resolve({fieldName, invalidMime: true, ...info}));
      } else {
        const outputBuffer = sharpStream.toBuffer();
        const filePromise = createFileFromStream(stream, outputBuffer, info, fieldName);
        allFilePromises.push(filePromise);
        stream.pipe(sharpStream);
      }
    });


    bb.on('close', () => {
      if (busboyError != null) return reject(busboyError);
      if (validationError != null) return resolve({validationError});
      Promise.all(allFilePromises)
             .then((files) => {
               resolve({files: files});
             })
             .catch((error) => reject(error))
    });
    req.pipe(bb);
  });
}


export const createMultiPartMiddleWare = (opts: Opts): ApiRouteHandler => {
  return async (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext): Promise<void> => {
    const headers = req.headers;
    const parserResults = await processFiles(headers, opts, req);
    context.addItem(UPLOADED_FILES_RESULT_KEY, parserResults);
  };
};


