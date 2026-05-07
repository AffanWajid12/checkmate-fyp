import { describe, expect, it, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server.js';
import { getMockToken, getMockUser } from '../utils.js';
import prisma from '../../src/config/prismaClient.js';

describe('Reference Materials Endpoints', () => {
    let teacherToken;
    let teacherUser;

    beforeEach(async () => {
        teacherToken = getMockToken('TEACHER');
        teacherUser = await prisma.users.create({ data: getMockUser('TEACHER') });
    });

    describe('POST /api/reference-materials', () => {
        it('should allow teacher to upload reference materials', async () => {
            const res = await request(app)
                .post('/api/reference-materials')
                .set('Authorization', teacherToken)
                .attach('files', Buffer.from('dummy content'), 'notes.pdf');
            
            expect(res.status).toBe(201);
            expect(res.body.materials.length).toBe(1);

            const dbMaterial = await prisma.reference_materials.findUnique({ where: { id: res.body.materials[0].id } });
            expect(dbMaterial).not.toBeNull();
            expect(dbMaterial.file_name).toBe('notes.pdf');
        });
    });

    describe('GET /api/reference-materials', () => {
        it('should fetch teachers reference materials', async () => {
            await prisma.reference_materials.create({
                data: {
                    teacher_id: teacherUser.id,
                    file_name: 'notes.pdf',
                    bucket_path: 'path',
                    file_size: 100,
                    mime_type: 'application/pdf'
                }
            });

            const res = await request(app)
                .get('/api/reference-materials')
                .set('Authorization', teacherToken);
            
            expect(res.status).toBe(200);
            expect(res.body.materials.length).toBe(1);
            expect(res.body.materials[0].file_name).toBe('notes.pdf');
        });
    });

    describe('DELETE /api/reference-materials/:id', () => {
        it('should delete a reference material', async () => {
            const mat = await prisma.reference_materials.create({
                data: {
                    teacher_id: teacherUser.id,
                    file_name: 'notes.pdf',
                    bucket_path: 'path',
                    file_size: 100,
                    mime_type: 'application/pdf'
                }
            });

            const res = await request(app)
                .delete(`/api/reference-materials/${mat.id}`)
                .set('Authorization', teacherToken);
            
            expect(res.status).toBe(200);

            const dbMat = await prisma.reference_materials.findUnique({ where: { id: mat.id } });
            expect(dbMat).toBeNull();
        });
    });
});
