import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
symbols_table = dynamodb.Table(os.environ['SYMBOLS_TABLE'])
metrics_table = dynamodb.Table(os.environ['METRICS_TABLE'])

def lambda_handler(event, context):
    path = event['requestContext']['http']['path']
    method = event['requestContext']['http']['method']
    
    print(f"Received request: {method} {path}")
    
    # Handle GET /symbols
    if path == '/symbols' and method == 'GET':
        try:
            response = symbols_table.scan()
            items = response.get('Items', [])
            return {
                'statusCode': 200,
                'body': json.dumps(items),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': str(e)})
            }
    
    # Handle GET /metrics/{symbol}
    if path.startswith('/metrics/') and method == 'GET':
        try:
            symbol = path.split('/')[-1]
            response = metrics_table.get_item(Key={'symbol': symbol})
            item = response.get('Item', {})
            
            if not item:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': 'Symbol not found'})
                }
                
            return {
                'statusCode': 200,
                'body': json.dumps(item),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': str(e)})
            }
    
    # Default response for other paths
    return {
        'statusCode': 404,
        'body': json.dumps({'message': 'Not Found'})
    }