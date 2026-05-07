import { describe, expect, it, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server.js';
import { getMockToken, getMockUser } from '../utils.js';
import prisma from '../../src/config/prismaClient.js';

describe('Course Endpoints', () => {
    let teacherToken;
    let studentToken;
    let teacherUser;

    beforeEach(async () => {
        teacherToken = getMockToken('TEACHER');
        studentToken = getMockToken('STUDENT');
        
        teacherUser = getMockUser('TEACHER');
        await prisma.users.create({ data: teacherUser });
        await prisma.users.create({ data: getMockUser('STUDENT') });
    });

    describe('POST /api/courses', () => {
        it('should allow teacher to create a course', async () => {
            const res = await request(app)
                .post('/api/courses')
                .set('Authorization', teacherToken)
                .send({ title: 'Math 101', description: 'Basic Math' });
            
            expect(res.status).toBe(201);
            expect(res.body.course.title).toBe('Math 101');
            expect(res.body.course.teacher_id).toBe(teacherUser.id);
            expect(res.body.course.code).toBeDefined();

            const dbCourse = await prisma.courses.findUnique({ where: { id: res.body.course.id } });
            expect(dbCourse).not.toBeNull();
        });

        it('should block student from creating a course', async () => {
            const res = await request(app)
                .post('/api/courses')
                .set('Authorization', studentToken)
                .send({ title: 'Math 101' });
            
            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/courses/my-courses', () => {
        it('should return courses for teacher', async () => {
            // First create a course
            await prisma.courses.create({
                data: { title: 'History', code: 'HIST101', teacher_id: teacherUser.id }
            });

            const res = await request(app)
                .get('/api/courses/my-courses')
                .set('Authorization', teacherToken);
            
            expect(res.status).toBe(200);
            expect(res.body.courses.length).toBe(1);
            expect(res.body.courses[0].title).toBe('History');
        });
    });

    describe('DELETE /api/courses/:id', () => {
        it('should delete course if user is the teacher', async () => {
            const course = await prisma.courses.create({
                data: { title: 'History', code: 'HIST101', teacher_id: teacherUser.id }
            });

            const res = await request(app)
                .delete(`/api/courses/${course.id}`)
                .set('Authorization', teacherToken);
            
            expect(res.status).toBe(200);

            const dbCourse = await prisma.courses.findUnique({ where: { id: course.id } });
            expect(dbCourse).toBeNull();
        });
    });
});
