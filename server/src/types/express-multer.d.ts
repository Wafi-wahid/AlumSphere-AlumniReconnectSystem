declare global {
  namespace Express {
    interface Request {
      file?: {
        filename: string;
        originalname?: string;
        // you can extend this later with mimetype, size, etc.
      };
    }
  }
}

export {};
