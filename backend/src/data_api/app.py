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

def _transform_overview_data(raw_data):
    """Transform Alpha Vantage overview data to dashboard format"""
    if not raw_data or 'Error Message' in raw_data:
        return {}
    
    # Helper functions for data transformations
    def _to_float(value):
        try:
            return float(value) if value and value != 'None' else None
        except (TypeError, ValueError):
            return None
    
    def _to_percentage(value):
        try:
            return f"{float(value)*100:.2f}%" if value and value != 'None' else None
        except (TypeError, ValueError):
            return None
    
    def _abbreviate_market_cap(value):
        try:
            cap = float(value)
            if cap >= 1e12:
                return f"{cap/1e12:.2f}T"
            elif cap >= 1e9:
                return f"{cap/1e9:.2f}B"
            elif cap >= 1e6:
                return f"{cap/1e6:.2f}M"
            return str(cap)
        except (TypeError, ValueError):
            return None
    
    return {
        "description": raw_data.get('Description', ''),
        "sector": raw_data.get('Sector', ''),
        "industry": raw_data.get('Industry', ''),
        "market_cap": _abbreviate_market_cap(raw_data.get('MarketCapitalization')),
        "pe_ratio": _to_float(raw_data.get('PERatio')),
        "dividend_yield": _to_percentage(raw_data.get('DividendYield')),
        "52_week_high": _to_float(raw_data.get('52WeekHigh')),
        "52_week_low": _to_float(raw_data.get('52WeekLow'))
    }

def lambda_handler(event, context):
    try:
        logger.info(f"Incoming event: {json.dumps(event)}")
        # Log the request path for debugging
        request_context = event.get('requestContext', {})
        http_info = request_context.get('http', {})
        path = http_info.get('path', '')
        method = http_info.get('method', '')
        logger.info(f"Handling {method} request for path: {path}")
        
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
        
        # Handle GET /financials/{symbol} with stage prefix support
        if path.endswith('/financials/') or path.endswith('/financials'):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing symbol in path'}),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
            
        # Handle all financials paths:
        # 1. /dev/financials/AEM (stage-prefixed)
        # 2. /financials/AEM (bare path with symbol in URL)
        # 3. /financials?symbol=AEM (bare path with query param)
        if method == 'GET' and ('/financials/' in path or path.endswith('/financials')):
            # Extract symbol from path if available
            if '/financials/' in path:
                parts = path.split('/')
                # Symbol is the last part after '/financials/'
                symbol_index = parts.index('financials') + 1
                if symbol_index < len(parts):
                    symbol = parts[symbol_index]
                else:
                    symbol = None
            else:
                # Try to get symbol from query parameters
                symbol = event.get('queryStringParameters', {}).get('symbol', None)
            
            if not symbol:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'Missing symbol parameter'}),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            symbol = path.split('/')[-1]
            current_time_sec = int(time.time())
            cache_validity_sec = 24 * 3600  # 1 day
            
            # Check cache first
            try:
                response = company_overview_table.get_item(Key={'symbol': symbol})
                item = response.get('Item')
                
                # Return cached data if fresh
                if item and current_time_sec - item.get('last_updated', 0) < cache_validity_sec:
                    return {
                        'statusCode': 200,
                        'body': json.dumps(item['financials']),
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
            income_url = f"https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol={symbol}&apikey={API_KEY}"
            balance_url = f"https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol={symbol}&apikey={API_KEY}"
            
            try:
                income_res = requests.get(income_url)
                balance_res = requests.get(balance_url)
                
                if income_res.status_code != 200 or balance_res.status_code != 200:
                    # Return stale data if available
                    if item:
                        logger.warn(f"API failed but returning stale financials for {symbol}")
                        return {
                            'statusCode': 200,
                            'body': json.dumps(item['financials']),
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            }
                        }
                    return {
                        'statusCode': 500,
                        'body': json.dumps({'error': 'Alpha Vantage API error'})
                    }
                
                income_data = income_res.json()
                balance_data = balance_res.json()
                
                # Transform to expected format
                financials = {
                    'symbol': symbol,
                    'incomeStatement': income_data,
                    'balanceSheet': balance_data
                }
                
                # Update cache
                try:
                    # First get existing item if any
                    existing = company_overview_table.get_item(Key={'symbol': symbol}).get('Item', {})
                    
                    # Update only financials and last_updated
                    company_overview_table.put_item(
                        Item={
                            **existing,
                            'symbol': symbol,
                            'financials': financials,
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
                        'body': json.dumps(item['financials']),
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    }
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': str(e)})
                }
                # Handle GET /overview/{symbol} with stage prefix support
                if path.endswith('/overview/') or path.endswith('/overview'):
                    return {
                        'statusCode': 400,
                        'body': json.dumps({'error': 'Missing symbol in path'}),
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    }
                    
                # Handle all overview paths:
                # 1. /dev/overview/AEM (stage-prefixed)
                # 2. /overview/AEM (bare path with symbol in URL)
                # 3. /overview?symbol=AEM (bare path with query param)
                if method == 'GET' and ('overview' in path):
                    # Extract symbol from path if available
                    parts = path.split('/')
                    try:
                        # Find position of 'overview' in path
                        ov_index = parts.index('overview')
                        if ov_index + 1 < len(parts):
                            symbol = parts[ov_index + 1]
                        else:
                            # Try query parameters if no symbol in path
                            symbol = event.get('queryStringParameters', {}).get('symbol', None)
                    except ValueError:
                        symbol = event.get('queryStringParameters', {}).get('symbol', None)
                    
                    if not symbol:
                        logger.error(f"Missing symbol in overview request: {path}")
                        return {
                            'statusCode': 400,
                            'body': json.dumps({'error': 'Missing symbol parameter'}),
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            }
                        }
                    symbol = path.split('/')[-1]
                    current_time_sec = int(time.time())
                    cache_validity_sec = 24 * 3600  # 24 hours
                    
                    try:
                        # Check cache first
                        response = company_overview_table.get_item(Key={'symbol': symbol})
                        item = response.get('Item')
                        
                        # Return cached data if fresh
                        if item and current_time_sec - item.get('last_updated', 0) < cache_validity_sec:
                            transformed_data = _transform_overview_data(item['overview_data'])
                            return {
                                'statusCode': 200,
                                'body': json.dumps(transformed_data),
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'
                                }
                            }
                    except Exception as e:
                        logger.error(f"Cache lookup failed: {str(e)}")
                        item = None
                    
                    # If cache miss or stale, call API with retry logic
                    API_KEY = os.environ['ALPHA_VANTAGE_API_KEY']
                    url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={symbol}&apikey={API_KEY}"
                    
                    try:
                        # Retry logic (3 attempts with 1s backoff)
                        raw_data = None
                        for attempt in range(3):
                            try:
                                res = requests.get(url, timeout=5)
                                if res.status_code == 200:
                                    raw_data = res.json()
                                    break
                                else:
                                    logger.warn(f"Attempt {attempt+1} failed with status {res.status_code}")
                            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                                logger.warn(f"Attempt {attempt+1} failed: {str(e)}")
                                if attempt == 2:
                                    raise
                                time.sleep(1)
                        
                        # Handle Alpha Vantage error responses
                        if not raw_data or 'Error Message' in raw_data or 'Information' in raw_data:
                            error_msg = raw_data.get('Error Message') or raw_data.get('Information') or 'No data from API'
                            logger.warn(f"Alpha Vantage API error for {symbol}: {error_msg}")
                            
                            # Return stale data if available
                            if item:
                                logger.warn(f"Returning stale data for {symbol}")
                                transformed_data = _transform_overview_data(item['overview_data'])
                                return {
                                    'statusCode': 200,
                                    'body': json.dumps(transformed_data),
                                    'headers': {
                                        'Content-Type': 'application/json',
                                        'Access-Control-Allow-Origin': '*'
                                    }
                                }
                            return {
                                'statusCode': 400,
                                'body': json.dumps({'error': error_msg, 'error_detail': 'AlphaVantageUnavailable'})
                            }
                        
                        # Validate required fields
                        REQUIRED_FIELDS = ['Symbol', 'Name', 'Sector', 'MarketCapitalization']
                        missing_fields = [field for field in REQUIRED_FIELDS if field not in raw_data]
                        if missing_fields:
                            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
                        
                        transformed_data = _transform_overview_data(raw_data)
                        
                        # Save to cache only if valid
                        try:
                            # Get existing item if any
                            existing = company_overview_table.get_item(Key={'symbol': symbol}).get('Item', {})
                            
                            company_overview_table.put_item(
                                Item={
                                    **existing,
                                    'symbol': symbol,
                                    'overview_data': raw_data,
                                    'last_updated': current_time_sec
                                }
                            )
                        except Exception as e:
                            logger.error(f"Failed to cache response: {str(e)}")
                        
                        return {
                            'statusCode': 200,
                            'body': json.dumps(transformed_data),
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
                            transformed_data = _transform_overview_data(item['overview_data'])
                            return {
                                'statusCode': 200,
                                'body': json.dumps(transformed_data),
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'
                                }
                            }
                        return {
                            'statusCode': 500,
                            'body': json.dumps({'error': str(e), 'error_detail': 'ServiceUnavailable'})
                        }
                        
                
        return {
            'statusCode': 404,
            'body': json.dumps({'message': 'Not Found'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
