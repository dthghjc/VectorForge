"""add annotation_data json fields to task_chats and message_audits

Revision ID: 4acde490e767
Revises: 0b5c022e87f7
Create Date: 2025-08-25 13:43:17.189396

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


# revision identifiers, used by Alembic.
revision: str = '4acde490e767'
down_revision: Union[str, None] = '0b5c022e87f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add annotation_data JSON field to task_chats table
    op.add_column('task_chats', sa.Column('annotation_data', mysql.JSON(), nullable=True, comment='完整标注数据JSON: intent_category, completeness, overall_satisfaction, general_notes等'))
    
    # Add annotation_data JSON field to message_audits table  
    op.add_column('message_audits', sa.Column('annotation_data', mysql.JSON(), nullable=True, comment='消息级标注数据JSON: relevance, fluency, accuracy, compliance等'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove annotation_data JSON fields (in reverse order)
    op.drop_column('message_audits', 'annotation_data')
    op.drop_column('task_chats', 'annotation_data')
