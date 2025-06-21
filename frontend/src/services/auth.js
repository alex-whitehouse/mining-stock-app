import { Auth } from '@aws-amplify/auth';

Auth.configure({
  region: process.env.REACT_APP_AWS_REGION,
  userPoolId: process.env.REACT_APP_USER_POOL_ID,
  userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
  authenticationFlowType: 'USER_PASSWORD_AUTH',
  oauth: {
    domain: `${process.env.REACT_APP_OAUTH_DOMAIN}.auth.${process.env.REACT_APP_AWS_REGION}.amazoncognito.com`,
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: process.env.REACT_APP_OAUTH_REDIRECT_SIGN_IN,
    redirectSignOut: process.env.REACT_APP_OAUTH_REDIRECT_SIGN_OUT,
    responseType: 'code'
  }
});

export const signUp = async (email, password) => {
  try {
    const { user } = await Auth.signUp({
      username: email,
      password,
      attributes: { email }
    });
    return user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

export const confirmSignUp = async (email, code) => {
  try {
    await Auth.confirmSignUp(email, code);
  } catch (error) {
    console.error('Error confirming sign up:', error);
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    const user = await Auth.signIn(email, password);
    return user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await Auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

export const getCurrentUser = async () => {
  try {
    return await Auth.currentAuthenticatedUser();
  } catch (error) {
    return null;
  }
};

export const getAuthToken = async () => {
  try {
    const session = await Auth.currentSession();
    return session.getIdToken().getJwtToken();
  } catch (error) {
    return null;
  }
};