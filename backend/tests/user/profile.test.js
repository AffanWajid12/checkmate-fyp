import { describe, expect, it, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server.js';
import { getMockToken, getMockUser } from '../utils.js';
import prisma from '../../src/config/prismaClient.js';

describe('User Profile Endpoints', () => {
    let token;
    let user;

    beforeEach(async () => {
        token = getMockToken('STUDENT');
        user = getMockUser('STUDENT');
        // Pre-create the user in DB
        await prisma.users.create({
            data: { id: user.id, email: user.email, name: user.name, role: user.role }
        });
    });

    describe('PATCH /api/users/profile', () => {
        it('should update user name', async () => {
            const res = await request(app)
                .patch('/api/users/profile')
                .set('Authorization', token)
                .send({ name: 'New Name' });
            
            expect(res.status).toBe(200);
            expect(res.body.user.name).toBe('New Name');

            const dbUser = await prisma.users.findUnique({ where: { id: user.id } });
            expect(dbUser.name).toBe('New Name');
        });
    });

    describe('PATCH /api/users/change-password', () => {
        it('should return 400 if missing new password', async () => {
            const res = await request(app)
                .patch('/api/users/change-password')
                .set('Authorization', token)
                .send({});
            
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Password is required');
        });
        
        // Since we mocked supabase, change password to supabase will just work implicitly via our mock or throw if not mocked
        // But change password just hits supabase.auth.updateUser, so let's check it returns 200.
    });

    describe('POST /api/users/profile-picture', () => {
        it('should update profile picture URL', async () => {
            // We use supertest's attach for file uploads
            const res = await request(app)
                .post('/api/users/profile-picture')
                .set('Authorization', token)
                .attach('file', Buffer.from('fake image data'), 'profile.jpg');
            
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Profile picture updated successfully');
            expect(res.body.signedUrl).toContain('http://mocked-url.com');
            
            const dbUser = await prisma.users.findUnique({ where: { id: user.id } });
            expect(dbUser.profile_picture).toContain('profile-pictures/');
        });
    });
});
