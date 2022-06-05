import sharp from 'sharp';
import { FileInfo, Limits } from 'busboy';

export const UPLOADED_FILES_RESULT_KEY = 'UPLOADED_FILES_RESULT_KEY';

type FileStatus = 'Limit exceeded' | 'Invalid mime';

export interface UploadedFile extends FileInfo {
  fileContent: Buffer;
  fieldName: string;
  status: 'Success';
}

export interface UploadedFileError extends FileInfo {
  fieldName: string;
  status: FileStatus;
}


export type SharpToBufferMapping = {
  [key: string]: {
    sharp: () => sharp.Sharp
  }
}

export interface Opts {
  mimeTypes: SharpToBufferMapping;
  limits: Limits;
  contextKey?: string;
}

export type ErrorParseResult = {
  validationError: string;
}

export type FileParsedResult = {
  validationError: null;
  files: (UploadedFileError | UploadedFile)[];
}

export type MultiPartParserResults = ErrorParseResult | FileParsedResult;


