import { jest } from '@jest/globals';

const mockSupabase = {
    storage: {
        from: jest.fn(function() { return mockSupabase.storage; }),
        upload: jest.fn().mockResolvedValue({ data: { path: 'mocked-file-path.pdf' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'http://mocked-url.com/mocked-file-path.pdf' } }),
        createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'http://mocked-url.com/signed' }, error: null }),
        download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: jest.fn().mockResolvedValue({ data: {}, error: null })
    },
    auth: {
        signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'mock-uuid' } }, error: null }),
        signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'mock-uuid' }, session: { access_token: 'mock-token' } }, error: null }),
        getUser: jest.fn(async (token) => {
            if (token === 'invalid-token') return { data: { user: null }, error: new Error('Invalid token') };
            
            // Generate user details based on token suffix (e.g. mock-token-TEACHER)
            const role = token.split('-').pop() || 'STUDENT';
            let id = '11111111-1111-1111-1111-111111111111';
            if (role === 'TEACHER') id = '22222222-2222-2222-2222-222222222222';
            if (role === 'ADMIN') id = '33333333-3333-3333-3333-333333333333';

            return {
                data: {
                    user: {
                        id,
                        email: `${role.toLowerCase()}@example.com`,
                        user_metadata: { role, name: `Mock ${role}` }
                    }
                },
                error: null
            };
        }),
        admin: {
            createUser: jest.fn().mockResolvedValue({ data: { user: { id: 'mock-uuid', email: 'test@example.com' } }, error: null }),
            deleteUser: jest.fn().mockResolvedValue({ data: {}, error: null }),
            updateUserById: jest.fn().mockResolvedValue({ data: {}, error: null })
        }
    }
};

export default mockSupabase;
