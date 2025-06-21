import os
import boto3
import requests

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['METAL_PRICES_TABLE'])

def lambda_handler(event, context):
    API_KEY = os.environ['FINNHUB_API_KEY']
    
    metals = {
        'gold': 'XAU/USD',
        'silver': 'XAG/USD',
        'platinum': 'XPT/USD',
        'palladium': 'XPD/USD'
    }
    
    for metal, symbol in metals.items():
        response = requests.get(
            f'https://finnhub.io/api/v1/forex/rates?base={symbol.split("/")[0]}&token={API_KEY}'
        )
        data = response.json()
        
        if 'quote' in data:
            table.put_item(Item={
                'metal': metal,
                'price': data['quote'],
                'timestamp': datetime.utcnow().isoformat(),
                'expiry': int(time.time()) + 3600  # 1 hour TTL
            })
    
    return {'status': 'success'}