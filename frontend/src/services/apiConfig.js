import { Auth } from '@aws-amplify/auth';

const getAuthToken = async () => {
  try {
    const session = await Auth.currentSession();
    return session.getIdToken().getJwtToken();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const configureApi = async () => {
  const token = await getAuthToken();
  
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  };
};