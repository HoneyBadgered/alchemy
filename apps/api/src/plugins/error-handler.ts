/**
 * Error Handler Plugin
 * Fastify plugin for centralized error handling
 */

import { FastifyPluginCallback, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { ApiError, handleZodError, toApiError } from '../utils/errors';

export const errorHandlerPlugin: FastifyPluginCallback = (fastify, opts, done) => {
  // Set custom error handler
  fastify.setErrorHandler((error: FastifyError | Error, request, reply) => {
    // Log error for debugging
    fastify.log.error({
      error,
      url: request.url,
      method: request.method,
      body: request.body,
      params: request.params,
      query: request.query,
    });

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const apiError = handleZodError(error);
      return reply.status(apiError.statusCode).send(apiError.toJSON());
    }

    // Handle ApiError instances
    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send(error.toJSON());
    }

    // Handle Fastify validation errors
    if ((error as FastifyError).validation) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Validation error',
        statusCode: 400,
        details: (error as FastifyError).validation,
      });
    }

    // Convert unknown errors to ApiError
    const apiError = toApiError(error);
    return reply.status(apiError.statusCode).send(apiError.toJSON());
  });

  done();
};
