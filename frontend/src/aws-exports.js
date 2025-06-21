const awsConfig = {
  Auth: {
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
  },
  API: {
    endpoints: [
      {
        name: 'miningApi',
        endpoint: process.env.REACT_APP_API_URL,
        region: process.env.REACT_APP_AWS_REGION
      }
    ]
  }
};

export default awsConfig;