import { describe, expect, it, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server.js';
import { getMockToken, getMockUser } from '../utils.js';
import prisma from '../../src/config/prismaClient.js';

describe('Comment Endpoints', () => {
    let studentToken;
    let studentUser;
    let course;
    let announcement;

    beforeEach(async () => {
        studentToken = getMockToken('STUDENT');
        studentUser = getMockUser('STUDENT');
        await prisma.users.create({ data: studentUser });

        const teacher = await prisma.users.create({ data: getMockUser('TEACHER') });
        course = await prisma.courses.create({
            data: { title: 'Test', code: 'T101', teacher_id: teacher.id }
        });
        
        // Enroll student to give them access to comment
        await prisma.enrollments.create({
            data: { course_id: course.id, student_id: studentUser.id }
        });

        announcement = await prisma.announcements.create({
            data: { title: 'News', description: 'Read this', course_id: course.id }
        });
    });

    describe('POST /api/courses/:courseId/announcements/:announcementId/comments', () => {
        it('should allow student to add a comment', async () => {
            const res = await request(app)
                .post(`/api/courses/${course.id}/announcements/${announcement.id}/comments`)
                .set('Authorization', studentToken)
                .send({ content: 'Thanks for the update!' });
            
            expect(res.status).toBe(201);
            expect(res.body.comment.content).toBe('Thanks for the update!');

            const dbComment = await prisma.announcement_comments.findUnique({ where: { id: res.body.comment.id } });
            expect(dbComment).not.toBeNull();
        });
    });

    describe('DELETE /api/courses/:courseId/announcements/:announcementId/comments/:commentId', () => {
        it('should allow student to delete their own comment', async () => {
            const comment = await prisma.announcement_comments.create({
                data: { content: 'My comment', announcement_id: announcement.id, user_id: studentUser.id }
            });

            const res = await request(app)
                .delete(`/api/courses/${course.id}/announcements/${announcement.id}/comments/${comment.id}`)
                .set('Authorization', studentToken);
            
            expect(res.status).toBe(200);

            const dbComment = await prisma.announcement_comments.findUnique({ where: { id: comment.id } });
            expect(dbComment).toBeNull();
        });
    });
});
