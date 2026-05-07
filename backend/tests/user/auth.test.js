import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server.js';
import { getMockToken, getMockUser } from '../utils.js';

describe('Auth Endpoints', () => {
    describe('GET /api/auth/me', () => {
        it('should return 401 if no token is provided', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Authorization header missing');
        });

        it('should return 401 if token is invalid', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token');
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Invalid or expired token');
        });

        it('should return user profile and sync to DB if token is valid', async () => {
            const token = getMockToken('STUDENT');
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', token);
            
            expect(res.status).toBe(200);
            expect(res.body.user).toHaveProperty('id');
            expect(res.body.user.role).toBe('STUDENT');
            expect(res.body.user.email).toBe('student@example.com');
        });
    });
});
