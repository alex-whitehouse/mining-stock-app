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
        
        # Extract request details with error handling
        try:
            request_context = event['requestContext']
            http_info = request_context['http']
            path = http_info['path']
            method = http_info['method']
        except KeyError as e:
            logger.error(f"Missing key in event: {str(e)}")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid request structure'})
            }
        
        # Handle GET /symbols (search endpoint)
        if (path == '/symbols' or path == '/dev/symbols') and method == 'GET':
            try:
                query_params = event.get('queryStringParameters', {})
                search_query = query_params.get('query', '')
                
                # Convert query to lowercase for case-insensitive search
                # Setup filter expression if query provided
                filter_expr = None
                expr_attr_values = {}
                
                if search_query:
                    # Case-insensitive search: convert query to lowercase and search symbol_lower
                    search_query_lower = search_query.lower()
                    # Use contains for substring matching
                    filter_expr = "contains(symbol_lower, :query_lower)"
                    expr_attr_values = {
                        ':query_lower': search_query_lower
                    }
                
                # Build scan parameters with pagination support
                all_items = []
                scan_params = {}
                if filter_expr:
                    scan_params['FilterExpression'] = filter_expr
                if expr_attr_values:
                    scan_params['ExpressionAttributeValues'] = expr_attr_values
                
                # Log detailed scan parameters for debugging
                logger.info(f"Symbols table scan parameters: {json.dumps(scan_params)}")
                logger.info(f"Symbols table name: {symbols_table.table_name}")
                
                try:
                    while True:
                        response = symbols_table.scan(**scan_params)
                        items_chunk = response.get('Items', [])
                        all_items.extend(items_chunk)
                        
                        # Stop if we have 50+ items or no more pages
                        if len(all_items) >= 50 or 'LastEvaluatedKey' not in response:
                            break
                            
                        # Continue to next page
                        scan_params['ExclusiveStartKey'] = response['LastEvaluatedKey']
                except Exception as e:
                    error_msg = f"DynamoDB scan error: {str(e)}"
                    logger.error(error_msg)
                    return {
                        'statusCode': 500,
                        'body': json.dumps({
                            'error': 'Database error',
                            'details': error_msg
                        })
                    }
                
                # Return up to 50 items
                items = all_items[:50]
                
                # Enhanced debug logging
                logger.info(f"Search for '{search_query}' (lower: '{search_query_lower}') returned {len(all_items)} matches, showing {len(items)}")
                if items:
                    logger.info(f"First item symbol: {items[0].get('symbol')}, symbol_lower: {items[0].get('symbol_lower')}")
                else:
                    logger.info("No matching items found in entire table")
                    # Additional debug: verify table contents
                    try:
                        ibm_item = symbols_table.get_item(
                            Key={'symbol': 'IBM', 'exchange': 'NYSE'}
                        ).get('Item')
                        logger.info(f"IBM record exists: {ibm_item is not None}")
                        if ibm_item:
                            logger.info(f"IBM symbol_lower: {ibm_item.get('symbol_lower')}")
                    except Exception as e:
                        logger.error(f"Error fetching IBM record: {str(e)}")
                return {
                    'statusCode': 200,
                    'body': json.dumps(items),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            except Exception as e:
                logger.error(f"Unhandled error in search handler: {str(e)}")
                return {
                    'statusCode': 500,
                    'body': json.dumps({
                        'error': 'Internal server error',
                        'details': str(e)
                    })
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
        
        # Handle GET /financials/{symbol} (Alpha Vantage endpoint with caching)
        if path.startswith('/financials/') and method == 'GET':
            symbol = path.split('/')[-1]
            current_time_sec = int(time.time())
            cache_validity_sec = 24 * 3600  # 1 day
            
            # Check cache first
            try:
                response = metrics_table.get_item(Key={'symbol': symbol})
                item = response.get('Item')
                
                # Return cached data if fresh
                if item and current_time_sec - item.get('last_updated', 0) < cache_validity_sec:
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
                item = None
            
            # If cache miss or stale, call API
            API_KEY = os.environ['ALPHA_VANTAGE_API_KEY']
            overview_url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={symbol}&apikey={API_KEY}"
            time_series_url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={API_KEY}"
            
            try:
                overview_res = requests.get(overview_url)
                time_series_res = requests.get(time_series_url)
                
                if overview_res.status_code != 200 or time_series_res.status_code != 200:
                    # Return stale data if available
                    if item:
                        logger.warn(f"API failed but returning stale financials for {symbol}")
                        return {
                            'statusCode': 200,
                            'body': json.dumps(item['data']),
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            }
                        }
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
                
                # Save to cache
                try:
                    metrics_table.put_item(
                        Item={
                            'symbol': symbol,
                            'data': financials,
                            'last_updated': current_time_sec
                        }
                    )
                except Exception as e:
                    logger.error(f"Failed to cache financials: {str(e)}")
                
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
                # Return stale data if available
                if item:
                    logger.warn(f"Returning stale financials for {symbol} after API failure")
                    return {
                        'statusCode': 200,
                        'body': json.dumps(item['data']),
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    }
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': str(e)})
                }
                
        # Handle GET /overview/{symbol} (Alpha Vantage Company Overview with permanent caching)
        if path.startswith('/overview/') and method == 'GET':
            symbol = path.split('/')[-1]
            current_time_sec = int(time.time())
            cache_validity_sec = 7 * 24 * 3600  # 7 days
            
            try:
                # Check cache first
                response = company_overview_table.get_item(Key={'symbol': symbol})
                item = response.get('Item')
                
                # Return cached data if fresh
                if item and current_time_sec - item.get('last_updated', 0) < cache_validity_sec:
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
                item = None
            
            # If cache miss or stale, call API
            API_KEY = os.environ['ALPHA_VANTAGE_API_KEY']
            url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={symbol}&apikey={API_KEY}"
            
            try:
                res = requests.get(url)
                if res.status_code != 200:
                    # Return stale data if available
                    if item:
                        logger.warn(f"API failed but returning stale data for {symbol}")
                        return {
                            'statusCode': 200,
                            'body': json.dumps(item['data']),
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            }
                        }
                    return {
                        'statusCode': res.status_code,
                        'body': json.dumps({'error': 'Alpha Vantage API error'})
                    }
                
                data = res.json()
                
                # Save to permanent cache
                try:
                    company_overview_table.put_item(
                        Item={
                            'symbol': symbol,
                            'data': data,
                            'last_updated': current_time_sec
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
                # Return stale data if available
                if item:
                    logger.warn(f"Returning stale data for {symbol} after API failure")
                    return {
                        'statusCode': 200,
                        'body': json.dumps(item['data']),
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    }
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
