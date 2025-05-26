# import os
# import sys
# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from app.core.config import settings
import mysql.connector
from mysql.connector import Error
import json
from uuid import uuid4
from datetime import datetime, timezone
import pytz
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class MySQLClient:
    def __init__(self):
        """
        初始化 MySQL 客户端
        """
        # 使用新的配置系统
        self.host = settings.DB_HOST
        self.port = settings.DB_PORT
        self.user = settings.DB_USER
        self.password = settings.DB_PASSWORD
        self.database = settings.DB_NAME
        self.connection = None

    def connect(self):
        """
        连接到 MySQL 数据库
        """
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database
            )
            if self.connection.is_connected():
                logging.info(f"成功连接到 MySQL 数据库: {self.database}")
                return True
        except Error as e:
            logging.error(f"连接 MySQL 数据库时出错: {e}")
            return False

    def disconnect(self):
        """
        断开与 MySQL 数据库的连接
        """
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logging.info("MySQL 数据库连接已关闭")

    def execute_query(self, query, params=None):
        """
        执行查询语句
        """
        if not self.connection or not self.connection.is_connected():
            logging.error("数据库未连接")
            return None
        
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params)
            result = cursor.fetchall()
            cursor.close()
            return result
        except Error as e:
            logging.error(f"执行查询时出错: {e}")
            return None

    def execute_update(self, query, params=None):
        """
        执行更新语句（INSERT, UPDATE, DELETE）
        """
        if not self.connection or not self.connection.is_connected():
            logging.error("数据库未连接")
            return False
        
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, params)
            self.connection.commit()
            cursor.close()
            logging.info(f"成功执行更新，影响行数: {cursor.rowcount}")
            return True
        except Error as e:
            logging.error(f"执行更新时出错: {e}")
            self.connection.rollback()
            return False

    def create_table_if_not_exists(self, table_name, table_schema):
        """
        如果表不存在则创建表
        """
        query = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            {table_schema}
        )
        """
        return self.execute_update(query)

    def insert_data(self, table_name, data):
        """
        插入数据到指定表
        """
        if not data:
            return False
        
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['%s'] * len(data))
        query = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
        
        return self.execute_update(query, list(data.values()))

    def update_data(self, table_name, data, condition):
        """
        更新表中的数据
        """
        if not data:
            return False
        
        set_clause = ', '.join([f"{key} = %s" for key in data.keys()])
        query = f"UPDATE {table_name} SET {set_clause} WHERE {condition}"
        
        return self.execute_update(query, list(data.values()))

    def delete_data(self, table_name, condition, params=None):
        """
        删除表中的数据
        """
        query = f"DELETE FROM {table_name} WHERE {condition}"
        return self.execute_update(query, params)

    def get_table_info(self, table_name):
        """
        获取表的结构信息
        """
        query = f"DESCRIBE {table_name}"
        return self.execute_query(query)

    def get_all_tables(self):
        """
        获取数据库中所有表的名称
        """
        query = "SHOW TABLES"
        result = self.execute_query(query)
        if result:
            return [list(row.values())[0] for row in result]
        return []

    def user_exists(self, username: str):
        """
        检查用户是否存在。
        :return: 用户 ID 或 None
        """
        query = "SELECT id FROM users WHERE username = %s"
        result = self.execute_query(query, (username,), fetch=True)
        return result[0]['id'] if result else None

    def create_user(self, username: str):
        """
        创建新用户。
        :return: 新用户 ID
        """
        user_id = str(uuid4())
        query = "INSERT INTO users (id, username) VALUES (%s, %s)"
        self.execute_query(query, (user_id, username))
        return user_id

    def get_or_create_user(self, username: str):
        """
        获取或创建用户。
        :return: 用户 ID
        """
        user_id = self.user_exists(username)
        return user_id if user_id else self.create_user(username)

    def conversation_exists(self, user_id: str, conversation_id: str):
        """
        检查对话是否存在。
        :return: 是否存在
        """
        query = "SELECT id FROM chat_history WHERE id = %s AND user_id = %s"
        result = self.execute_query(query, (conversation_id, user_id), fetch=True)
        return bool(result)

    def create_conversation(self, user_id: str):
        """
        创建新对话。
        :return: 对话 ID
        """
        conversation_id = str(uuid4())
        system_message = [{"role": "system", "content": "你是一个专业的问答助手，专注于基于已知信息回答用户的问题。"}]
        query = "INSERT INTO chat_history (id, user_id, conversation_history, timestamp) VALUES (%s, %s, %s, %s)"
        # timestamp = datetime.now(timezone.utc)
        # 使用 pytz 设置为北京时间
        beijing_tz = pytz.timezone('Asia/Shanghai')
        timestamp = datetime.now(beijing_tz)
        self.execute_query(query, (conversation_id, user_id, json.dumps(system_message), timestamp))
        return conversation_id

    def get_or_create_conversation(self, user_id: str, conversation_id: str = None):
        """
        获取或创建对话。
        :return: 对话 ID
        """
        if conversation_id and self.conversation_exists(user_id, conversation_id):
            return conversation_id
        return self.create_conversation(user_id)

    def append_to_conversation(self, username: str, conversation_id: str, message: str, is_user: bool):
        """
        追加对话内容。
        :param username: 用户名
        :param conversation_id: 对话 ID
        :param message: 对话内容
        :param is_user: 是否为用户消息
        """
        user_id = self.get_or_create_user(username)
        conversation_id = self.get_or_create_conversation(user_id, conversation_id)
        
        role = "user" if is_user else "assistant"
        new_message = {"role": role, "content": message}
        
        # 获取当前的会话历史
        query = "SELECT conversation_history FROM chat_history WHERE id = %s"
        result = self.execute_query(query, (conversation_id,), fetch=True)
        
        if result:
            history = json.loads(result[0]['conversation_history'])
            history.append(new_message)
            updated_history = json.dumps(history)
            # timestamp = datetime.now(timezone.utc)
            # 使用 pytz 设置为北京时间
            beijing_tz = pytz.timezone('Asia/Shanghai')
            timestamp = datetime.now(beijing_tz)
            
            query = "UPDATE chat_history SET conversation_history = %s, timestamp = %s WHERE id = %s"
            self.execute_query(query, (updated_history, timestamp, conversation_id))

        return conversation_id

# 使用示例
if __name__ == "__main__":
    # 创建 MySQL 客户端实例
    mysql_client = MySQLClient()
    
    # 连接数据库
    if mysql_client.connect():
        # 获取所有表
        tables = mysql_client.get_all_tables()
        print(f"数据库中的表: {tables}")
        
        # 断开连接
        mysql_client.disconnect()
    else:
        print("无法连接到数据库")