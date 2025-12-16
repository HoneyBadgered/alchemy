/**
 * Admin Authentication Middleware
 * 
 * Verifies that the user is authenticated and has admin role
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../utils/prisma';

/**
 * Verify JWT token and check admin role
 */
export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      email: string;
    };

    // Get user from database to check role
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    if (!user) {
      return reply.status(401).send({ message: 'User not found' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return reply.status(403).send({ message: 'Access denied. Admin privileges required.' });
    }

    // Attach user to request
    request.user = {
      userId: user.id,
      email: user.email,
    };
  } catch (error) {
    return reply.status(401).send({ message: 'Invalid or expired token' });
  }
}
