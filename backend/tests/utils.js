export const getMockToken = (role = 'STUDENT') => `Bearer mock-token-${role}`;

export const getMockUser = (role = 'STUDENT') => {
    let id = '11111111-1111-1111-1111-111111111111';
    if (role === 'TEACHER') id = '22222222-2222-2222-2222-222222222222';
    if (role === 'ADMIN') id = '33333333-3333-3333-3333-333333333333';
    return {
        id,
        email: `${role.toLowerCase()}@example.com`,
        name: `Mock ${role}`,
        role: role
    };
};
