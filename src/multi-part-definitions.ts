import sharp from 'sharp';
import { FileInfo, Limits } from 'busboy';

export const UPLOADED_FILES_RESULT_KEY = 'UPLOADED_FILES_RESULT_KEY';

export interface UploadedFile extends FileInfo {
  fileContent?: Buffer;
  fieldName: string;
  limitExceeded?: boolean;
  invalidMime?: boolean;
}

export type SharpToBufferMapping = {
  [key: string]: {
    sharpStream: () => sharp.Sharp
  }
}

export interface Opts {
  mimeTypes: SharpToBufferMapping;
  limits: Limits;
}

export type MultiPartParserResults = {
  validationError?: string;
  files?: UploadedFile[];
}


