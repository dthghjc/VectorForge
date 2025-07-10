"""Initial database schema

Revision ID: c1f5213960dd
Revises: 
Create Date: 2025-07-10 14:19:21.780374

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import LONGTEXT, JSON


# revision identifiers, used by Alembic.
revision: str = 'c1f5213960dd'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """创建所有表结构"""
    
    # 创建用户表
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('username', sa.String(64), nullable=False, unique=True, index=True),
        sa.Column('email', sa.String(320), nullable=True, unique=True, index=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, comment="是否激活"),
        sa.Column('is_email_verified', sa.Boolean(), nullable=False, default=False, comment="邮箱是否验证"),
        sa.Column('role', sa.Enum('user', 'annotation', 'admin', name='userrole'), nullable=False, default='user', comment="用户角色"),
        sa.Column('total_annotations', sa.Integer(), nullable=False, default=0, comment="总标注数"),
        sa.Column('approved_annotations', sa.Integer(), nullable=False, default=0, comment="通过标注数"),
        sa.Column('avatar_url', sa.String(500), nullable=True, comment="头像URL"),
        sa.Column('last_login_at', sa.DateTime(), nullable=True, comment="最后登录时间"),
        sa.Column('preferences', JSON, nullable=True, comment="用户偏好设置"),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    
    # 创建对话表
    op.create_table(
        'chats',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )
    
    # 创建消息表
    op.create_table(
        'messages',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('role', sa.String(255), nullable=False, comment="消息角色: user/assistant/system"),
        sa.Column('content', LONGTEXT, nullable=False),
        sa.Column('chat_id', sa.String(36), nullable=False),
        sa.Column('meta_data', JSON, nullable=True),
        sa.Column('audit_status', sa.String(20), nullable=False, default="pending", comment="审核状态: pending/approved/rejected"),
        sa.Column('is_flagged', sa.String(1), nullable=False, default="0", comment="是否被标记: 0-否, 1-是"),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['chat_id'], ['chats.id']),
    )
    
    # 创建消息审核表
    op.create_table(
        'message_audits',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('message_id', sa.String(36), nullable=False),
        sa.Column('annotator_id', sa.String(36), nullable=False),
        sa.Column('audit_result', sa.Enum('approved', 'rejected', 'pending', name='auditresult'), nullable=False, comment="审核结果"),
        sa.Column('confidence_score', sa.Float(), nullable=True, comment="置信度分数"),
        sa.Column('notes', sa.Text(), nullable=True, comment="审核备注"),
        sa.Column('audit_type', sa.Enum('auto', 'manual', name='audittype'), nullable=False, default='manual', comment="审核类型"),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id']),
        sa.ForeignKeyConstraint(['annotator_id'], ['users.id']),
    )
    
    # 创建索引
    op.create_index('idx_users_username', 'users', ['username'])
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_chats_user_id', 'chats', ['user_id'])
    op.create_index('idx_messages_chat_id', 'messages', ['chat_id'])
    op.create_index('idx_messages_audit_status', 'messages', ['audit_status'])
    op.create_index('idx_message_audits_message_id', 'message_audits', ['message_id'])
    op.create_index('idx_message_audits_annotator_id', 'message_audits', ['annotator_id'])


def downgrade() -> None:
    """删除所有表结构"""
    
    # 删除索引
    op.drop_index('idx_message_audits_annotator_id', 'message_audits')
    op.drop_index('idx_message_audits_message_id', 'message_audits')
    op.drop_index('idx_messages_audit_status', 'messages')
    op.drop_index('idx_messages_chat_id', 'messages')
    op.drop_index('idx_chats_user_id', 'chats')
    op.drop_index('idx_users_email', 'users')
    op.drop_index('idx_users_username', 'users')
    
    # 删除表（注意顺序，先删除有外键依赖的表）
    op.drop_table('message_audits')
    op.drop_table('messages')
    op.drop_table('chats')
    op.drop_table('users')
    
    # 删除枚举类型（MySQL中可能需要）
    op.execute("DROP TYPE IF EXISTS audittype")
    op.execute("DROP TYPE IF EXISTS auditresult")
    op.execute("DROP TYPE IF EXISTS userrole")
