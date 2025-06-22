'''import os
import boto3
import requests

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['SYMBOLS_TABLE'])

def lambda_handler(event, context):
    API_KEY = os.environ['FINNHUB_API_KEY']
    
    try:
        # Get TSXV stocks
        response = requests.get(
            f'https://finnhub.io/api/v1/stock/symbol?exchange=V&token={API_KEY}'
        )
        response.raise_for_status()
        stocks = response.json()
        
        # Filter and save to DynamoDB
        with table.batch_writer() as batch:
            for stock in stocks:
                if stock.get('type') == 'Common Stock':
                    batch.put_item(Item={
                        'symbol': stock['symbol'],
                        'exchange': stock.get('exchange', 'V'),
                        'name': stock.get('description', ''),
                        'currency': stock.get('currency', ''),
                        'type': stock.get('type', '')
                    })
                    
        return {'status': 'success', 'count': len(stocks)}
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return {'status': 'error', 'message': str(e)}

        '''

# src/symbol_ingest/app.py
import os
import boto3
from datetime import datetime
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['SYMBOLS_TABLE'])

def lambda_handler(event, context):
    try:
        # Sample mining stocks
        sample_symbols = [
            {'symbol': 'ABR', 'exchange': 'TSXV', 'name': 'Arbor Metals Corp.', 'currency': 'CAD'},
            {'symbol': 'GSS', 'exchange': 'NYSE', 'name': 'Golden Star Resources', 'currency': 'USD'},
            {'symbol': 'NG', 'exchange': 'TSX', 'name': 'NovaGold Resources Inc.', 'currency': 'CAD'},
            {'symbol': 'K', 'exchange': 'NYSE', 'name': 'Kinross Gold Corporation', 'currency': 'USD'},
            {'symbol': 'AEM', 'exchange': 'NYSE', 'name': 'Agnico Eagle Mines', 'currency': 'USD'},
        ]
        
        with table.batch_writer() as batch:
            for symbol in sample_symbols:
                batch.put_item(Item={
                    **symbol,
                    'type': 'Common Stock',
                    'last_updated': datetime.utcnow().isoformat()
                })
        
        return {'statusCode': 200, 'body': 'Sample symbols inserted'}
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {'statusCode': 500, 'body': str(e)}
