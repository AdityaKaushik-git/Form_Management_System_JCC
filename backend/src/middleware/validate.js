import { ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';

/**
 * Zod validation middleware factory
 *
 * @param {object} schemas - Object with optional keys: body, params, query
 *   Each value is a Zod schema to validate that part of the request.
 *   If a plain Zod schema is passed (not an object with body/params/query),
 *   it is treated as a body schema for convenience.
 * @returns {Function} Express middleware
 *
 * @example
 *   // Validate body only (shorthand)
 *   router.post('/login', validate(loginSchema), loginController);
 *
 *   // Validate body, params, and query
 *   router.get('/items/:id',
 *     validate({ params: idParamSchema, query: paginationSchema }),
 *     getItemController
 *   );
 */
const validate = (schemas) => {
  // If a raw Zod schema is passed, wrap it as { body: schema }
  const schemaMap = schemas._def ? { body: schemas } : schemas;

  return (req, _res, next) => {
    const errors = [];

    for (const [source, schema] of Object.entries(schemaMap)) {
      if (!schema || !['body', 'params', 'query'].includes(source)) continue;

      const result = schema.safeParse(req[source]);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            field: `${source}.${issue.path.join('.')}`,
            message: issue.message,
            code: issue.code,
          });
        }
      } else {
        // Replace req[source] with parsed (and transformed) data
        req[source] = result.data;
      }
    }

    if (errors.length > 0) {
      return next(ApiError.badRequest('Validation failed', errors));
    }

    next();
  };
};

export { validate };
export default validate;
