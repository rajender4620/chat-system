// Extends Express's Request type so TypeScript/JSDoc knows about
// the custom `userId` field that our requireAuth middleware attaches.
// Declaration merging: adds to the existing Request interface, not replacing it.

import 'express'

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string
  }
}
