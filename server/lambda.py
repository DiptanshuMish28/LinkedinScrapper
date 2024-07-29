import pymysql
import os
import json
from datetime import datetime

# Database settings from environment variables
rds_host = os.environ['RDS_HOST']
db_username = os.environ['DB_USERNAME']
db_password = os.environ['DB_PASSWORD']
db_name = os.environ['DB_NAME']

def lambda_handler(event, context):
    try:
        # Connect to the MySQL database
        conn = pymysql.connect(
            host=rds_host,
            user=db_username,
            passwd=db_password,
            db=db_name,
            connect_timeout=5
        )
    except pymysql.MySQLError as e:
        print(f"ERROR: Could not connect to MySQL instance. {e}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Could not connect to MySQL instance: {e}")
        }

    with conn.cursor() as cursor:
        try:
            # Extract and validate data from the event
            data = json.loads(event['body'])
            id = data.get('id')
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            title = data.get('title')
            account_name = data.get('account_name')
            lead_source = data.get('Leadsource', 'linkedin.com')  # Default value if not present
            phone_mobile = data.get('phone_mobile')
            linkedin_url = data.get('linkedin_url')  # New field

            # Check for missing fields
            missing_fields = []
            if not id: missing_fields.append('id')
            if not first_name: missing_fields.append('first_name')
            if not last_name: missing_fields.append('last_name')
            if not title: missing_fields.append('title')
            if not account_name: missing_fields.append('account_name')

            if missing_fields:
                return {
                    'statusCode': 400,
                    'body': json.dumps(f"Missing required field(s): {', '.join(missing_fields)}")
                }

            # Length validation
            if any(len(str(field)) > max_len for field, max_len in zip(
                [id, first_name, last_name, title, account_name, phone_mobile, linkedin_url], 
                [255, 50, 50, 100, 100, 100, 255])):
                return {
                    'statusCode': 400,
                    'body': json.dumps("One or more fields exceed the maximum length.")
                }
        except json.JSONDecodeError as e:
            return {
                'statusCode': 400,
                'body': json.dumps(f"Invalid JSON format: {e}")
            }

        try:
            # Check if the record exists
            select_sql = "SELECT id FROM leads WHERE id = %s"
            cursor.execute(select_sql, (id,))
            result = cursor.fetchone()

            if result:
                # Record exists, update it
                update_sql = """UPDATE leads 
                                SET first_name = %s, last_name = %s, title = %s, account_name = %s, lead_source = %s, 
                                    phone_mobile = %s, linkedin_url = %s, date_modified = %s
                                WHERE id = %s"""
                print(f"Executing SQL: {update_sql} with params: {(first_name, last_name, title, account_name, lead_source, phone_mobile, linkedin_url, datetime.now(), id)}")
                cursor.execute(update_sql, (first_name, last_name, title, account_name, lead_source, phone_mobile, linkedin_url, datetime.now(), id))
            else:
                # Record does not exist, insert it
                insert_sql = """INSERT INTO leads (id, date_entered, date_modified, first_name, last_name, title, 
                                                   account_name, lead_source, phone_mobile, linkedin_url) 
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                print(f"Executing SQL: {insert_sql} with params: {(id, datetime.now(), datetime.now(), first_name, last_name, title, account_name, lead_source, phone_mobile, linkedin_url)}")
                cursor.execute(insert_sql, (id, datetime.now(), datetime.now(), first_name, last_name, title, account_name, lead_source, phone_mobile, linkedin_url))

            conn.commit()
            print("Data committed successfully.")
        except pymysql.MySQLError as e:
            print(f"ERROR: Could not insert or update data in MySQL table. {e}")
            return {
                'statusCode': 500,
                'body': json.dumps(f"Database operation error: {e}")
            }
        finally:
            conn.close()

    return {
        'statusCode': 200,
        'body': json.dumps('Data processed successfully!')
    }
