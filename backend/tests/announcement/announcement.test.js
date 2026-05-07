import { describe, expect, it, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server.js';
import { getMockToken, getMockUser } from '../utils.js';
import prisma from '../../src/config/prismaClient.js';

describe('Announcement Endpoints', () => {
    let teacherToken;
    let course;

    beforeEach(async () => {
        teacherToken = getMockToken('TEACHER');
        const teacher = await prisma.users.create({ data: getMockUser('TEACHER') });
        course = await prisma.courses.create({
            data: { title: 'Test Course', code: 'TEST101', teacher_id: teacher.id }
        });
    });

    describe('POST /api/courses/:courseId/announcements', () => {
        it('should create an announcement', async () => {
            const res = await request(app)
                .post(`/api/courses/${course.id}/announcements`)
                .set('Authorization', teacherToken)
                .field('title', 'Welcome')
                .field('description', 'Welcome to the course')
                .attach('files', Buffer.from('file content'), 'file1.txt'); // using our mocked supabase storage
            
            expect(res.status).toBe(201);
            expect(res.body.announcement.title).toBe('Welcome');

            const dbAnn = await prisma.announcements.findUnique({
                where: { id: res.body.announcement.id },
                include: { resources: true }
            });
            expect(dbAnn).not.toBeNull();
            expect(dbAnn.resources.length).toBe(1); // One file attached
        });
    });

    describe('GET /api/courses/:courseId/announcements', () => {
        it('should retrieve announcements for a course', async () => {
            await prisma.announcements.create({
                data: { title: 'Exam next week', description: 'Prepare', course_id: course.id }
            });

            const res = await request(app)
                .get(`/api/courses/${course.id}/announcements`)
                .set('Authorization', teacherToken);
            
            expect(res.status).toBe(200);
            expect(res.body.announcements.length).toBe(1);
            expect(res.body.announcements[0].title).toBe('Exam next week');
        });
    });

    describe('DELETE /api/courses/:courseId/announcements/:id', () => {
        it('should delete an announcement', async () => {
            const ann = await prisma.announcements.create({
                data: { title: 'Cancel class', description: 'Sick', course_id: course.id }
            });

            const res = await request(app)
                .delete(`/api/courses/${course.id}/announcements/${ann.id}`)
                .set('Authorization', teacherToken);
            
            expect(res.status).toBe(200);
            
            const dbAnn = await prisma.announcements.findUnique({ where: { id: ann.id } });
            expect(dbAnn).toBeNull();
        });
    });
});
