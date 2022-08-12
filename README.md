# next-api-image-middleware

A NextJs middleware for fast image processing in memory. 

NextJs middleware plugin for [next-middle-api](https://www.npmjs.com/package/next-middle-api) as a middleware.
It combines [busboy](https://www.npmjs.com/package/busboy) and [sharp](https://www.npmjs.com/package/sharp) to handle image uploads.

## Main features

- It uses streams and buffers in memory to makes it fast
- Define transforms using sharp per mime type
- Apply validation to restrict sizes
- Get images as buffers in the handler 

## Important

Ensure that you configure the route to not parse the body 

```typescript
// project-root/pages/api/uploads/avatars.ts
export const config = {
  api: {
    bodyParser: false
  }
}
```

## Usage

The code below is an example of how to process a multipart file upload.

```typescript
import { createHandlers } from 'next-middle-api';
import fs from 'fs/promises';
import { createMultiPartMiddleWare, MultiPartParserResults, UPLOADED_FILES_RESULT_KEY, UploadedFile } from 'next-api-image-middleware';
import sharp from 'sharp';


// required by next js to not parse files before the middleware reads it
export const config = {
  api: {
    bodyParser: false
  }
}


// define your custom image middleware
const customKey = 'MY_CUSTOM_KEY';
const imageMiddleWare = createMultiPartMiddleWare({
  // define busy boy specific limits
  limits: {
    fileSize: 1024 * 1024 * 5,
    files: 1
  },
  mimeTypes: {
    // define allowed mimetypes and their sharp specific manipulations
    'image/jpeg': {sharp: () => sharp().jpeg({quality: 80})},
    'image/png': {sharp: () => sharp().png({quality: 80})},
    'image/gif': {sharp: () => sharp().gif()},
    'image/webp': {sharp: () => sharp().webp({quality: 80})}
  },
  contextKey: customKey // default is the `UPLOADED_FILES_RESULT_KEY` constant
});


export default createHandlers({
  post: {
    handler: async (req, res, context) => {
      const results = context.getItem(customKey) as MultiPartParserResults;

      //check if there were any validation errors
      //if this error is present you should ignore files as busboy does not process any further in this case
      if (results.validationError != null) return res.status(400).json({message: results.validationError});

      // check if specific files had issues as some might be errored and some might be fine
      const erroredFiles = results.files.filter(x => x.status != 'Success');
      const errors = erroredFiles.map(x => x.status).join(',');
      if (erroredFiles.length !== 0) return res.status(400).json({message: `Some files have these issues: ${errors}`});

      // get the file content as a buffer
      const files = results.files as UploadedFile[];
      await fs.writeFile(new URL('file:///C:/test.jpeg'), files[0].fileContent);
      return res.status(200).json({message: 'ok'});
    },
    preHooks: [imageMiddleWare]
  }
});

```


