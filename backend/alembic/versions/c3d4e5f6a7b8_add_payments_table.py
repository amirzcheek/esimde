"""add payments table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-03 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'payments',
        sa.Column('id',                  sa.Integer(),     primary_key=True),
        sa.Column('appointment_id',      sa.Integer(),     sa.ForeignKey('appointments.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),
        sa.Column('user_id',             sa.Integer(),     sa.ForeignKey('users.id',        ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('paylink_order_id',    sa.String(200),   nullable=True,  index=True),
        sa.Column('paylink_payment_url', sa.String(500),   nullable=True),
        sa.Column('amount',              sa.Integer(),     nullable=False),
        sa.Column('currency',            sa.String(10),    server_default='KZT'),
        sa.Column('status',              sa.String(20),    server_default='pending', nullable=False),
        sa.Column('created_at',          sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at',          sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    # Добавляем статус awaiting_payment в enum appointments
    op.execute("ALTER TYPE appointmentstatus ADD VALUE IF NOT EXISTS 'awaiting_payment'")

def downgrade():
    op.drop_table('payments')
