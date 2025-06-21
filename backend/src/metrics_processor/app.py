'''import os
import boto3
import requests
import math
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
symbols_table = dynamodb.Table(os.environ['SYMBOLS_TABLE'])
metrics_table = dynamodb.Table(os.environ['METRICS_TABLE'])

def calculate_graham(eps, bvps):
    if eps <= 0 or bvps <= 0:
        return None
    return math.sqrt(22.5 * eps * bvps)

def lambda_handler(event, context):
    API_KEY = os.environ['FINNHUB_API_KEY']
    
    # Get all symbols
    symbols_response = symbols_table.scan()
    symbols = [item['symbol'] for item in symbols_response['Items']]
    
    for symbol in symbols:
        # Get quote
        quote_url = f'https://finnhub.io/api/v1/quote?symbol={symbol}&token={API_KEY}'
        quote = requests.get(quote_url).json()
        
        # Get financials
        financials_url = f'https://finnhub.io/api/v1/stock/metric?symbol={symbol}&metric=all&token={API_KEY}'
        financials = requests.get(financials_url).json()
        
        # Calculate value metrics
        eps = financials['metric'].get('epsNormalizedAnnual')
        bvps = financials['metric'].get('bookValuePerShareAnnual')
        
        metrics = {
            'symbol': symbol,
            'price': quote.get('c'),
            'graham_ratio': calculate_graham(eps, bvps),
            'pe_ratio': financials['metric'].get('peNormalizedAnnual'),
            'pb_ratio': financials['metric'].get('pbAnnual'),
            'market_cap': financials['metric'].get('marketCapitalization'),
            'last_updated': datetime.utcnow().isoformat()
        }
        
        # Save to metrics table
        metrics_table.put_item(Item=metrics)
    
    return {'status': 'success', 'metrics_processed': len(symbols)} '''

import os
import boto3
import random
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
symbols_table = dynamodb.Table(os.environ['SYMBOLS_TABLE'])
metrics_table = dynamodb.Table(os.environ['METRICS_TABLE'])

def lambda_handler(event, context):
    # For testing, add sample metrics
    sample_metrics = [
        {
            'symbol': 'ABR',
            'price': round(random.uniform(0.5, 2.5), 2),
            'change': round(random.uniform(-5, 5), 2),
            'pe_ratio': round(random.uniform(5, 30), 2),
            'pb_ratio': round(random.uniform(0.5, 3.5), 2),
            'debt_equity': round(random.uniform(0.1, 1.5), 2),
            'current_ratio': round(random.uniform(1.0, 3.0), 2),
            'market_cap': random.randint(5000000, 500000000),
            'graham_ratio': round(random.uniform(0.8, 3.0), 2),
            'aisc': random.randint(800, 1600),
            'production_oz': random.randint(50000, 500000),
            'resources_oz': random.randint(1000000, 5000000),
            'shares_outstanding': random.randint(50000000, 500000000),
            'last_updated': datetime.utcnow().isoformat()
        },
        {
            'symbol': 'NG',
            'price': round(random.uniform(5, 15), 2),
            'change': round(random.uniform(-5, 5), 2),
            'pe_ratio': round(random.uniform(5, 30), 2),
            'pb_ratio': round(random.uniform(0.5, 3.5), 2),
            'debt_equity': round(random.uniform(0.1, 1.5), 2),
            'current_ratio': round(random.uniform(1.0, 3.0), 2),
            'market_cap': random.randint(1000000000, 5000000000),
            'graham_ratio': round(random.uniform(8, 20), 2),
            'aisc': random.randint(900, 1400),
            'production_oz': random.randint(200000, 800000),
            'resources_oz': random.randint(10000000, 30000000),
            'shares_outstanding': random.randint(200000000, 800000000),
            'last_updated': datetime.utcnow().isoformat()
        },
        {
            'symbol': 'K',
            'price': round(random.uniform(5, 10), 2),
            'change': round(random.uniform(-5, 5), 2),
            'pe_ratio': round(random.uniform(5, 30), 2),
            'pb_ratio': round(random.uniform(0.5, 3.5), 2),
            'debt_equity': round(random.uniform(0.1, 1.5), 2),
            'current_ratio': round(random.uniform(1.0, 3.0), 2),
            'market_cap': random.randint(5000000000, 15000000000),
            'graham_ratio': round(random.uniform(6, 12), 2),
            'aisc': random.randint(1000, 1500),
            'production_oz': random.randint(1500000, 2500000),
            'resources_oz': random.randint(50000000, 150000000),
            'shares_outstanding': random.randint(1000000000, 1500000000),
            'last_updated': datetime.utcnow().isoformat()
        }
    ]
    
    with metrics_table.batch_writer() as batch:
        for metric in sample_metrics:
            batch.put_item(Item=metric)
    
    return {
        'statusCode': 200,
        'body': f"Inserted sample metrics"
    }