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

import os
import boto3
import requests
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
symbols_table = dynamodb.Table(os.environ['SYMBOLS_TABLE'])

def lambda_handler(event, context):
    # For testing, add sample symbols
    sample_symbols = [
        {
            'symbol': 'ABR',
            'exchange': 'TSXV',
            'name': 'Arbor Metals Corp.',
            'currency': 'CAD',
            'type': 'Common Stock',
            'last_updated': datetime.utcnow().isoformat()
        },
        {
            'symbol': 'NG',
            'exchange': 'TSX',
            'name': 'NovaGold Resources Inc.',
            'currency': 'CAD',
            'type': 'Common Stock',
            'last_updated': datetime.utcnow().isoformat()
        },
        {
            'symbol': 'K',
            'exchange': 'NYSE',
            'name': 'Kinross Gold Corporation',
            'currency': 'USD',
            'type': 'Common Stock',
            'last_updated': datetime.utcnow().isoformat()
        }
    ]
    
    with symbols_table.batch_writer() as batch:
        for symbol in sample_symbols:
            batch.put_item(Item=symbol)
    
    return {
        'statusCode': 200,
        'body': f"Inserted sample symbols"
    }
