import { describe, expect, it, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server.js';
import { getMockToken, getMockUser } from '../utils.js';
import prisma from '../../src/config/prismaClient.js';

describe('Assessment Endpoints', () => {
    let teacherToken;
    let course;
    let announcement;

    beforeEach(async () => {
        teacherToken = getMockToken('TEACHER');
        const teacher = await prisma.users.create({ data: getMockUser('TEACHER') });
        course = await prisma.courses.create({
            data: { title: 'Test Course', code: 'TEST101', teacher_id: teacher.id }
        });
        announcement = await prisma.announcements.create({
            data: { title: 'Announcement', description: 'Desc', course_id: course.id }
        });
    });

    describe('POST /api/courses/:courseId/announcements/:announcementId/assessments', () => {
        it('should create an assessment', async () => {
            const res = await request(app)
                .post(`/api/courses/${course.id}/announcements/${announcement.id}/assessments`)
                .set('Authorization', teacherToken)
                .field('title', 'Midterm')
                .field('type', 'EXAM')
                .field('total_marks', '100');
            
            expect(res.status).toBe(201);
            expect(res.body.assessment.title).toBe('Midterm');

            const dbAssessment = await prisma.assessments.findUnique({ where: { id: res.body.assessment.id } });
            expect(dbAssessment).not.toBeNull();
        });
    });

    describe('GET /api/courses/:courseId/assessments/:assessmentId', () => {
        it('should get assessment details', async () => {
            const assessment = await prisma.assessments.create({
                data: { title: 'Quiz 1', type: 'QUIZ', announcement_id: announcement.id }
            });

            const res = await request(app)
                .get(`/api/courses/${course.id}/assessments/${assessment.id}`)
                .set('Authorization', teacherToken);
            
            expect(res.status).toBe(200);
            expect(res.body.assessment.title).toBe('Quiz 1');
        });
    });

    describe('DELETE /api/courses/:courseId/assessments/:assessmentId', () => {
        it('should delete an assessment', async () => {
            const assessment = await prisma.assessments.create({
                data: { title: 'Quiz 1', type: 'QUIZ', announcement_id: announcement.id }
            });

            const res = await request(app)
                .delete(`/api/courses/${course.id}/assessments/${assessment.id}`)
                .set('Authorization', teacherToken);
            
            expect(res.status).toBe(200);

            const dbAssessment = await prisma.assessments.findUnique({ where: { id: assessment.id } });
            expect(dbAssessment).toBeNull();
        });
    });
});
