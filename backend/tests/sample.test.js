import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/server.js';
import prisma from '../src/config/prismaClient.js';


describe('User Authentication/API Endpoints', () => {
    it('should be able to interact with the database directly', async () => {
        // Direct Database Operation Test
        const newUser = await prisma.users.create({
            data: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'test@example.com',
                name: 'Test User',
                role: 'STUDENT'
            }
        });

        expect(newUser.email).toBe('test@example.com');
        expect(newUser.name).toBe('Test User');
        
        // Let's verify it actually went to the DB
        const fetchedUser = await prisma.users.findUnique({
            where: { email: 'test@example.com' }
        });
        
        expect(fetchedUser).not.toBeNull();
        expect(fetchedUser.name).toBe('Test User');
    });

    // Example of how an API test would look
    /* 
    it('should return 401 for unauthorized API call', async () => {
        const response = await request(app).get('/api/users/profile');
        expect(response.status).toBe(401); 
    });
    */
});
