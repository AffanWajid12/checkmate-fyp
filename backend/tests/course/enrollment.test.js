import { describe, expect, it, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server.js';
import { getMockToken, getMockUser } from '../utils.js';
import prisma from '../../src/config/prismaClient.js';

describe('Enrollment Endpoints', () => {
    let studentToken;
    let studentUser;
    let course;

    beforeEach(async () => {
        studentToken = getMockToken('STUDENT');
        studentUser = getMockUser('STUDENT');
        
        await prisma.users.create({ data: studentUser });
        const teacher = await prisma.users.create({ data: getMockUser('TEACHER') });
        
        course = await prisma.courses.create({
            data: { title: 'Science', code: 'SCI101', teacher_id: teacher.id }
        });
    });

    describe('POST /api/courses/enroll', () => {
        it('should enroll a student using valid course code', async () => {
            const res = await request(app)
                .post('/api/courses/enroll')
                .set('Authorization', studentToken)
                .send({ code: 'SCI101' });
            
            expect(res.status).toBe(201);
            expect(res.body.enrollment.course_id).toBe(course.id);
            expect(res.body.enrollment.student_id).toBe(studentUser.id);
        });

        it('should return 404 for invalid code', async () => {
            const res = await request(app)
                .post('/api/courses/enroll')
                .set('Authorization', studentToken)
                .send({ code: 'INVALID' });
            
            expect(res.status).toBe(404);
        });

        it('should prevent double enrollment', async () => {
            await prisma.enrollments.create({
                data: { course_id: course.id, student_id: studentUser.id }
            });

            const res = await request(app)
                .post('/api/courses/enroll')
                .set('Authorization', studentToken)
                .send({ code: 'SCI101' });
            
            expect(res.status).toBe(409);
        });
    });

    describe('GET /api/courses/enrolled', () => {
        it('should return courses student is enrolled in', async () => {
            await prisma.enrollments.create({
                data: { course_id: course.id, student_id: studentUser.id }
            });

            const res = await request(app)
                .get('/api/courses/enrolled')
                .set('Authorization', studentToken);
            
            expect(res.status).toBe(200);
            expect(res.body.courses.length).toBe(1);
            expect(res.body.courses[0].title).toBe('Science');
        });
    });

    describe('DELETE /api/courses/unenroll/:courseId', () => {
        it('should unenroll a student', async () => {
            await prisma.enrollments.create({
                data: { course_id: course.id, student_id: studentUser.id }
            });

            const res = await request(app)
                .delete(`/api/courses/unenroll/${course.id}`)
                .set('Authorization', studentToken);
            
            expect(res.status).toBe(200);

            const dbEnrollment = await prisma.enrollments.findFirst({
                where: { course_id: course.id, student_id: studentUser.id }
            });
            expect(dbEnrollment).toBeNull();
        });
    });
});
