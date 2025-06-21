def lambda_handler(event, context):
    symbols = event['queryStringParameters']['symbols'].split(',')
    
    # Get metrics for all symbols
    response = dynamodb.batch_get_item(
        RequestItems={
            os.environ['METRICS_TABLE']: {
                'Keys': [{'symbol': s} for s in symbols]
            }
        }
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps(response['Responses'][os.environ['METRICS_TABLE']])
    }