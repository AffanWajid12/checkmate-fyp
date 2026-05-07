import { describe, expect, it, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server.js';
import { getMockToken, getMockUser } from '../utils.js';
import prisma from '../../src/config/prismaClient.js';

describe('Attendance Endpoints', () => {
    let teacherToken;
    let studentToken;
    let studentUser;
    let course;

    beforeEach(async () => {
        teacherToken = getMockToken('TEACHER');
        studentToken = getMockToken('STUDENT');
        
        studentUser = await prisma.users.create({ data: getMockUser('STUDENT') });
        const teacher = await prisma.users.create({ data: getMockUser('TEACHER') });
        
        course = await prisma.courses.create({
            data: { title: 'Test Course', code: 'TEST101', teacher_id: teacher.id }
        });
        
        await prisma.enrollments.create({
            data: { course_id: course.id, student_id: studentUser.id }
        });
    });

    describe('POST /api/courses/:courseId/attendance', () => {
        it('should mark attendance for a new session', async () => {
            const res = await request(app)
                .post(`/api/courses/${course.id}/attendance`)
                .set('Authorization', teacherToken)
                .send({
                    date: '2026-05-07',
                    title: 'Lecture 1',
                    records: [{ student_id: studentUser.id, status: 'PRESENT' }]
                });
            
            expect(res.status).toBe(200);
            expect(res.body.sessionId).toBeDefined();

            const dbSession = await prisma.attendance_sessions.findUnique({
                where: { id: res.body.sessionId },
                include: { records: true }
            });
            expect(dbSession).not.toBeNull();
            expect(dbSession.records.length).toBe(1);
            expect(dbSession.records[0].status).toBe('PRESENT');
        });
    });

    describe('GET /api/courses/:courseId/attendance', () => {
        it('should get all attendance sessions for teacher', async () => {
            await prisma.attendance_sessions.create({
                data: { course_id: course.id, date: new Date(), title: 'Lec 1' }
            });

            const res = await request(app)
                .get(`/api/courses/${course.id}/attendance`)
                .set('Authorization', teacherToken);
            
            expect(res.status).toBe(200);
            expect(res.body.sessions.length).toBe(1);
        });
    });

    describe('DELETE /api/courses/:courseId/attendance/:sessionId', () => {
        it('should delete a session', async () => {
            const session = await prisma.attendance_sessions.create({
                data: { course_id: course.id, date: new Date() }
            });

            const res = await request(app)
                .delete(`/api/courses/${course.id}/attendance/${session.id}`)
                .set('Authorization', teacherToken);
            
            expect(res.status).toBe(200);

            const dbSession = await prisma.attendance_sessions.findUnique({ where: { id: session.id } });
            expect(dbSession).toBeNull();
        });
    });
});
