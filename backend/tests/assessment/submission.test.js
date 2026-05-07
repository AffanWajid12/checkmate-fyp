import { describe, expect, it, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server.js';
import { getMockToken, getMockUser } from '../utils.js';
import prisma from '../../src/config/prismaClient.js';

describe('Submission Endpoints', () => {
    let studentToken;
    let studentUser;
    let teacherToken;
    let course;
    let assessment;

    beforeEach(async () => {
        studentToken = getMockToken('STUDENT');
        studentUser = await prisma.users.create({ data: getMockUser('STUDENT') });
        
        teacherToken = getMockToken('TEACHER');
        const teacher = await prisma.users.create({ data: getMockUser('TEACHER') });
        
        course = await prisma.courses.create({
            data: { title: 'Test Course', code: 'TEST101', teacher_id: teacher.id }
        });
        
        await prisma.enrollments.create({
            data: { course_id: course.id, student_id: studentUser.id }
        });

        const announcement = await prisma.announcements.create({
            data: { title: 'Announcement', description: 'Desc', course_id: course.id }
        });

        assessment = await prisma.assessments.create({
            data: { title: 'Assignment 1', type: 'ASSIGNMENT', announcement_id: announcement.id, visible_to_students: true }
        });
    });

    describe('POST /api/courses/:courseId/assessments/:assessmentId/submit', () => {
        it('should allow student to submit an assessment', async () => {
            const res = await request(app)
                .post(`/api/courses/${course.id}/assessments/${assessment.id}/submit`)
                .set('Authorization', studentToken)
                .attach('files', Buffer.from('file content'), 'submission.pdf');
            
            expect(res.status).toBe(201);
            expect(res.body.submission.status).toBe('SUBMITTED');

            const dbSub = await prisma.submissions.findUnique({
                where: { user_id_assessment_id: { user_id: studentUser.id, assessment_id: assessment.id } }
            });
            expect(dbSub).not.toBeNull();
        });
    });

    describe('DELETE /api/courses/:courseId/assessments/:assessmentId/submit', () => {
        it('should unsubmit an assessment', async () => {
            await prisma.submissions.create({
                data: { user_id: studentUser.id, assessment_id: assessment.id, status: 'SUBMITTED' }
            });

            const res = await request(app)
                .delete(`/api/courses/${course.id}/assessments/${assessment.id}/submit`)
                .set('Authorization', studentToken);
            
            expect(res.status).toBe(200);

            const dbSub = await prisma.submissions.findUnique({
                where: { user_id_assessment_id: { user_id: studentUser.id, assessment_id: assessment.id } }
            });
            expect(dbSub).toBeNull();
        });
    });
});
