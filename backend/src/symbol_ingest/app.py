import os
import boto3
import requests
import json
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['SYMBOLS_TABLE'])

def lambda_handler(event, context):
    try:
        API_KEY = os.environ['ALPHA_VANTAGE_API_KEY']
        items_to_write = []
        
        # Get symbols from event or default to mining stocks
        symbols = event.get('symbols', [
            "GOLD", "NEM", "AEM", "KL", "WPM", "AG", "PAAS", "EXK", "HL", "MUX",
            "CDE", "FSM", "SAND", "SSRM", "OR", "RGLD", "SA", "TAHO", "IAG", "GFI"
        ])
        
        # Handle manual trigger with single symbol
        if 'symbol' in event:
            symbols = [event['symbol']]
        
        for symbol in symbols:
            # Get company overview
            overview_url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={symbol}&apikey={API_KEY}"
            response = requests.get(overview_url)
            data = response.json()
            
            # Skip if no data
            if not data or 'Symbol' not in data:
                continue
                
            # Create item with lowercase symbol for search
            item = {
                'symbol': symbol,
                'symbol_lower': symbol.lower(),
                'exchange': data.get('Exchange', ''),
                'name': data.get('Name', ''),
                'sector': data.get('Sector', ''),
                'industry': data.get('Industry', ''),
                'description': data.get('Description', ''),
                'last_updated': datetime.utcnow().isoformat()
            }
            items_to_write.append(item)
        
        # Write items to DynamoDB
        with table.batch_writer() as batch:
            for item in items_to_write:
                try:
                    batch.put_item(Item=item)
                    logger.info(f"Successfully wrote item: {json.dumps(item)}")
                except Exception as e:
                    logger.error(f"Failed to write item: {json.dumps(item)}")
                    logger.error(f"Error details: {str(e)}")
                    continue
        
        return {
            'statusCode': 200,
            'body': f'Successfully ingested {len(items_to_write)} stocks'
        }
        
    except Exception as e:
        logger.error(f"Symbol ingest failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': f'Symbol ingest failed: {str(e)}'
        }
