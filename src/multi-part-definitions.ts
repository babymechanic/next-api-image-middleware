import { FitEnum } from 'sharp';
import { FileInfo, Limits } from 'busboy';

export const UPLOADED_FILES_RESULT_KEY = 'UPLOADED_FILES_RESULT_KEY';
export const jpegMimeType = 'image/jpeg';
export const pngMimeType = 'image/png';
export const gifMimeType = 'image/gif';
export const webpMimeType = 'image/webp';

export type AllowedFileTypes = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';


export type FitType = keyof FitEnum;

export interface UploadedFile extends FileInfo {
  fileContent?: Buffer;
  fieldName: string;
  limitExceeded?: boolean;
  invalidMime?: boolean;
}

export interface Opts {
  allowedTypes?: AllowedFileTypes[];
  height: number;
  width: number;
  fit: FitType;
  limits: Limits;
}

export type MultiPartParserResults = {
  validationError?: string;
  files?: UploadedFile[];
}
