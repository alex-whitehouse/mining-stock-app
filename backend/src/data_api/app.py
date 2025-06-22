import json
import boto3
import os
import logging
import requests
import time
from boto3.dynamodb.conditions import Key

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
symbols_table = dynamodb.Table(os.environ['SYMBOLS_TABLE'])
metrics_table = dynamodb.Table(os.environ['METRICS_TABLE'])
company_overview_table = dynamodb.Table(os.environ['COMPANY_OVERVIEW_TABLE'])

def lambda_handler(event, context):
    try:
        logger.info(f"Incoming event: {json.dumps(event)}")
        
        path = event['requestContext']['http']['path']
        method = event['requestContext']['http']['method']
        
        # Handle GET /symbols (search endpoint)
        if (path == '/symbols' or path == '/dev/symbols') and method == 'GET':
            query_params = event.get('queryStringParameters', {})
            search_query = query_params.get('query', '')
            
            # Convert query to lowercase for case-insensitive search
            if search_query:
                search_query = search_query.lower()
            
            # Setup filter expression if query provided
            filter_expr = None
            expr_attr_values = {}
            expr_attr_names = {}
            
            if search_query:
                # Enhanced search to include sector and industry fields
                filter_expr = "contains(symbol_lower, :query) or contains(#name, :query) or contains(sector, :query) or contains(industry, :query)"
                expr_attr_values = {':query': search_query}
                expr_attr_names = {'#name': 'name'}  # 'name' is reserved word
            
            # Perform scan with optional filtering and pagination
            scan_params = {
                'FilterExpression': filter_expr,
                'ExpressionAttributeValues': expr_attr_values,
                'ExpressionAttributeNames': expr_attr_names
            }
            
            # Remove None values
            scan_params = {k: v for k, v in scan_params.items() if v is not None}
            
            # Perform scan with optional filtering, limited to 50 items
            scan_params['Limit'] = 50
            response = symbols_table.scan(**scan_params)
            items = response.get('Items', [])
            return {
                'statusCode': 200,
                'body': json.dumps(items),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        
        # Handle GET /metrics/{symbol}
        if path.startswith('/metrics/') and method == 'GET':
            symbol = path.split('/')[-1]
            # The metrics table uses only symbol as the primary key
            response = metrics_table.get_item(Key={'symbol': symbol})
            item = response.get('Item', {})
            return {
                'statusCode': 200,
                'body': json.dumps(item),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
            
        # Handle GET /symbol/{symbol} (detail endpoint)
        if path.startswith('/symbol/') and method == 'GET':
            symbol = path.split('/')[-1]
            # The symbols table uses composite key (symbol, exchange)
            # Query by symbol only (partition key)
            response = symbols_table.query(
                KeyConditionExpression=Key('symbol').eq(symbol)
            )
            items = response.get('Items', [])
            return {
                'statusCode': 200,
                'body': json.dumps(items),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        
        # Handle GET /financials/{symbol} (Alpha Vantage endpoint)
        if path.startswith('/financials/') and method == 'GET':
            symbol = path.split('/')[-1]
            
            # Get API key from environment
            API_KEY = os.environ['ALPHA_VANTAGE_API_KEY']
            
            # Call Alpha Vantage APIs
            overview_url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={symbol}&apikey={API_KEY}"
            time_series_url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={API_KEY}"
            
            try:
                overview_res = requests.get(overview_url)
                time_series_res = requests.get(time_series_url)
                
                if overview_res.status_code != 200 or time_series_res.status_code != 200:
                    return {
                        'statusCode': 500,
                        'body': json.dumps({'error': 'Alpha Vantage API error'})
                    }
                
                overview_data = overview_res.json()
                time_series_data = time_series_res.json()
                
                # Extract latest price from time series
                daily_data = time_series_data.get('Time Series (Daily)', {})
                latest_date = sorted(daily_data.keys(), reverse=True)[0] if daily_data else None
                latest_price = daily_data.get(latest_date, {}).get('4. close') if latest_date else None
                
                # Map to expected format
                financials = {
                    'symbol': symbol,
                    'companyName': overview_data.get('Name', ''),
                    'latestPrice': latest_price,
                    'change': None,  # Not provided in these endpoints
                    'changePercent': None,  # Not provided in these endpoints
                    'overview': overview_data,
                    'timeSeries': time_series_data
                }
                
                return {
                    'statusCode': 200,
                    'body': json.dumps(financials),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
                
            except Exception as e:
                logger.error(f"Financial data fetch failed: {str(e)}")
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': str(e)})
                }
                
        # Handle GET /overview/{symbol} (Alpha Vantage Company Overview with caching)
        if path.startswith('/overview/') and method == 'GET':
            symbol = path.split('/')[-1]
            current_time_sec = int(time.time())
            
            try:
                # Check cache first
                response = company_overview_table.get_item(Key={'symbol': symbol})
                if 'Item' in response:
                    item = response['Item']
                    # Check if cache is still valid
                    if item.get('expiration_time', 0) > current_time_sec:
                        return {
                            'statusCode': 200,
                            'body': json.dumps(item['data']),
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            }
                        }
            except Exception as e:
                logger.error(f"Cache lookup failed: {str(e)}")
            
            # If cache miss or expired, call API
            API_KEY = os.environ['ALPHA_VANTAGE_API_KEY']
            url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={symbol}&apikey={API_KEY}"
            
            try:
                res = requests.get(url)
                if res.status_code != 200:
                    return {
                        'statusCode': res.status_code,
                        'body': json.dumps({'error': 'Alpha Vantage API error'})
                    }
                
                data = res.json()
                
                # Save to cache with 24h TTL
                try:
                    expiration_time = current_time_sec + 24 * 3600  # 24 hours
                    company_overview_table.put_item(
                        Item={
                            'symbol': symbol,
                            'data': data,
                            'expiration_time': expiration_time
                        }
                    )
                except Exception as e:
                    logger.error(f"Failed to cache response: {str(e)}")
                
                return {
                    'statusCode': 200,
                    'body': json.dumps(data),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
                
            except Exception as e:
                logger.error(f"API call failed: {str(e)}")
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': str(e)})
                }
                
        return {
            'statusCode': 404,
            'body': json.dumps({'message': 'Not Found'})
        }
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
