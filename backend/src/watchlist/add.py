import json
import boto3
import os
import jwt
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['WATCHLIST_TABLE'])
user_pool_id = os.environ['USER_POOL_ID']
region = os.environ['COGNITO_REGION']

def get_user_id_from_token(token):
    try:
        jwks_url = f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json'
        jwks_client = jwt.PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        decoded = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=os.environ['USER_POOL_CLIENT_ID'],
            options={"verify_exp": True}
        )
        return decoded['sub']
    except Exception as e:
        print(f"Token validation error: {str(e)}")
        return None

def lambda_handler(event, context):
    try:
        # Get token from Authorization header
        token = event['headers'].get('Authorization', '').split(' ')[-1]
        if not token:
            return {
                'statusCode': 401,
                'body': json.dumps({'message': 'Authorization token missing'})
            }
        
        user_id = get_user_id_from_token(token)
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
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Internal server error'})
        }