import { describe, expect, it, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server.js';
import { getMockToken, getMockUser } from '../utils.js';
import prisma from '../../src/config/prismaClient.js';

describe('Admin Endpoints', () => {
    let adminToken;
    let studentToken;

    beforeEach(async () => {
        adminToken = getMockToken('ADMIN');
        studentToken = getMockToken('STUDENT');
        
        // Ensure tokens create DB users via auth sync or manual create
        const adminUser = getMockUser('ADMIN');
        await prisma.users.create({ data: adminUser });

        const studentUser = getMockUser('STUDENT');
        await prisma.users.create({ data: studentUser });
    });

    describe('GET /api/admin/users', () => {
        it('should deny access to non-admins', async () => {
            const res = await request(app).get('/api/admin/users').set('Authorization', studentToken);
            expect(res.status).toBe(403);
        });

        it('should allow admins to fetch all users', async () => {
            const res = await request(app).get('/api/admin/users').set('Authorization', adminToken);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.users)).toBe(true);
            expect(res.body.users.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('PATCH /api/admin/users/:id/role', () => {
        it('should update user role', async () => {
            const studentId = getMockUser('STUDENT').id;
            const res = await request(app)
                .patch(`/api/admin/users/${studentId}/role`)
                .set('Authorization', adminToken)
                .send({ role: 'TEACHER' });
            
            expect(res.status).toBe(200);
            expect(res.body.updatedUser.role).toBe('TEACHER');

            const dbUser = await prisma.users.findUnique({ where: { id: studentId } });
            expect(dbUser.role).toBe('TEACHER');
        });
    });

    describe('DELETE /api/admin/users/:id', () => {
        it('should delete user from db', async () => {
            const studentId = getMockUser('STUDENT').id;
            const res = await request(app)
                .delete(`/api/admin/users/${studentId}`)
                .set('Authorization', adminToken);
            
            expect(res.status).toBe(200);
            const dbUser = await prisma.users.findUnique({ where: { id: studentId } });
            expect(dbUser).toBeNull();
        });
    });
});
