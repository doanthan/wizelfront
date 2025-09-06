// Test script to verify authentication
const fetch = require('node-fetch');

async function testAuth() {
  try {
    // First, try to get a session
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
      headers: {
        'Cookie': 'authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..tE3VZBsNzB2DFhzm.Oob9JvLa_2vqrKZ5-Qu0pnIg0y4TLQzCKpQo4Gfoj2VY5ciqwqN0MJwKdFdRvOShOkgQCzlzBCWOzCNBx7xJm3Pxt0JCdXCXF3XemJ91qy1R4xH2-J7QDEJwAbLqY9uAJGQtOiHhCsXQcLmZ2bZUUIZYJ6M4DPFWC0OJf3Qo36QUPykrbOQYCnBvP5MmgHupbMH3xdv5zHCPBXxv5VVIKjHGx5vqSCJhyHQ2M1DQ0GJE_d7jMJXmcb7p1TZJpFrjRKGUgRsYJyiikkkq3vj0JJ9YkyUZ1ojVxJWJbyBl0AXE11o0DpKzR_ueaojPHvVa7sJENddLGcb_CqJRr8xQAJPdOy56PzQT4E40nCkTiYjgtpq7BRzrFCPwb4sJOzwNvvpJGG0V2HdSqrPiOOLmXXYJ_Zz6iYy_w3vMQUP8r3HJwZgzwUz6k4L6a-oXL3BRUJUjWdWO6lqJCJJqRxNO9xnb8eJUKrWsNgAXgCBX5ZY7V8uetvf3aJRCQ6cA_GaVgtf4N-JzU-FMRj5JzN8J9n0TRFJz6rbfXlLQJZJVN5JgAP-lCp3W2KJjQb76HchT0HQeGm0J4psBMNrQ7bnOSZ1Ke6zxeUGVJ23RoiXP8v5w8qOqaRl2yyT5K_Tv_KDHWwJlMSy29hnNJ7XgP0YQJzoN6k.wEGN1y4sQ4W0Kz6h8vNDCA'
      }
    });

    console.log('Session response status:', sessionResponse.status);
    const sessionData = await sessionResponse.text();
    console.log('Session data:', sessionData);

    // Now try the collections API
    const collectionsResponse = await fetch('http://localhost:3000/api/store/oERwhWN/collections', {
      headers: {
        'Cookie': 'authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..tE3VZBsNzB2DFhzm.Oob9JvLa_2vqrKZ5-Qu0pnIg0y4TLQzCKpQo4Gfoj2VY5ciqwqN0MJwKdFdRvOShOkgQCzlzBCWOzCNBx7xJm3Pxt0JCdXCXF3XemJ91qy1R4xH2-J7QDEJwAbLqY9uAJGQtOiHhCsXQcLmZ2bZUUIZYJ6M4DPFWC0OJf3Qo36QUPykrbOQYCnBvP5MmgHupbMH3xdv5zHCPBXxv5VVIKjHGx5vqSCJhyHQ2M1DQ0GJE_d7jMJXmcb7p1TZJpFrjRKGUgRsYJyiikkkq3vj0JJ9YkyUZ1ojVxJWJbyBl0AXE11o0DpKzR_ueaojPHvVa7sJENddLGcb_CqJRr8xQAJPdOy56PzQT4E40nCkTiYjgtpq7BRzrFCPwb4sJOzwNvvpJGG0V2HdSqJRr8xQAJPdOy56PzQT4E40nCkTiYjgtpq7BRzrFCPwb4sJOzwNvvpJGG0V2HdSqrPiOOLmXXYJ_Zz6iYy_w3vMQUP8r3HJwZgzwUz6k4L6a-oXL3BRUJUjWdWO6lqJCJJqRxNO9xnb8eJUKrWsNgAXgCBX5ZY7V8uetvf3aJRCQ6cA_GaVgtf4N-JzU-FMRj5JzN8J9n0TRFJz6rbfXlLQJZJVN5JgAP-lCp3W2KJjQb76HchT0HQeGm0J4psBMNrQ7bnOSZ1Ke6zxeUGVJ23RoiXP8v5w8qOqaRl2yyT5K_Tv_KDHWwJlMSy29hnNJ7XgP0YQJzoN6k.wEGN1y4sQ4W0Kz6h8vNDCA'
      }
    });

    console.log('Collections response status:', collectionsResponse.status);
    const collectionsData = await collectionsResponse.text();
    console.log('Collections data:', collectionsData);

  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth();