import json
import boto3
import os
import jwt
from datetime import datetime
from jose import jwk, jwt
from jose.utils import base64url_decode
import requests

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['WATCHLIST_TABLE'])
region = os.environ['AWS_REGION']
user_pool_id = os.environ['USER_POOL_ID']
app_client_id = os.environ['APP_CLIENT_ID']

def verify_token(token):
    try:
        jwks_url = f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json'
        jwks = requests.get(jwks_url).json()['keys']
        
        headers = jwt.get_unverified_headers(token)
        kid = headers['kid']
        
        key = next(k for k in jwks if k['kid'] == kid)
        public_key = jwk.construct(key)
        
        message, encoded_signature = token.rsplit('.', 1)
        decoded_signature = base64url_decode(encoded_signature.encode('utf-8'))
        
        if not public_key.verify(message.encode('utf-8'), decoded_signature):
            return None
            
        claims = jwt.get_unverified_claims(token)
        
        if claims['aud'] != app_client_id:
            return None
            
        return claims['sub']
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return None

def lambda_handler(event, context):
    try:
        # Get token from headers
        token = event['headers'].get('Authorization', '').split(' ')[-1]
        if not token:
            return {
                'statusCode': 401,
                'body': json.dumps({'message': 'Missing token'})
            }
        
        user_id = verify_token(token)
        if not user_id:
            return {
                'statusCode': 401,
                'body': json.dumps({'message': 'Invalid token'})
            }
        
        # Parse request body
        body = json.loads(event['body'])
        symbol = body.get('symbol')
        name = body.get('name')
        
        if not symbol or not name:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Missing symbol or name'})
            }
        
        # Add to watchlist
        table.put_item(Item={
            'userId': user_id,
            'symbol': symbol,
            'name': name,
            'addedAt': datetime.utcnow().isoformat()
        })
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Added to watchlist'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'message': str(e)})
        }