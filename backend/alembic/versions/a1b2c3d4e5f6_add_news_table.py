"""add news table

Revision ID: a1b2c3d4e5f6
Revises: 808115905b23
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '808115905b23'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'news',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('image_path', sa.String(500), nullable=True),
        sa.Column('author_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_news_created_at', 'news', ['created_at'])
    op.create_index('ix_news_is_published', 'news', ['is_published'])


def downgrade() -> None:
    op.drop_index('ix_news_is_published', 'news')
    op.drop_index('ix_news_created_at', 'news')
    op.drop_table('news')
