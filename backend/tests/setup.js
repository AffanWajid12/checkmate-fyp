import { jest } from '@jest/globals';
import prisma from '../src/config/prismaClient.js';


// Optional: Clean up specific tables before each test
beforeEach(async () => {
    // Truncate tables to ensure tests are isolated
    await prisma.$transaction([
        prisma.attendance.deleteMany(),
        prisma.attendance_sessions.deleteMany(),
        prisma.evaluations.deleteMany(),
        prisma.attachments.deleteMany(),
        prisma.submissions.deleteMany(),
        prisma.source_materials.deleteMany(),
        prisma.grading_blueprints.deleteMany(),
        prisma.assessment_insights.deleteMany(),
        prisma.assessments.deleteMany(),
        prisma.announcement_resources.deleteMany(),
        prisma.announcement_comments.deleteMany(),
        prisma.announcements.deleteMany(),
        prisma.enrollments.deleteMany(),
        prisma.courses.deleteMany(),
        prisma.generated_assessment_reference_materials.deleteMany(),
        prisma.reference_materials.deleteMany(),
        prisma.generated_assessments.deleteMany(),
        prisma.users.deleteMany()
    ]);
});

afterAll(async () => {
    await prisma.$disconnect();
});
