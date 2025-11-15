from django.contrib import admin
from .models import BlockchainProgressUpdate, BlockchainDocument


@admin.register(BlockchainProgressUpdate)
class BlockchainProgressUpdateAdmin(admin.ModelAdmin):
    list_display = ['progress_id', 'project', 'property', 'ipfs_hash', 'blockchain_tx_id', 'created_at', 'uploaded_by']
    list_filter = ['created_at', 'project']
    search_fields = ['progress_id', 'description', 'ipfs_hash', 'blockchain_tx_id']
    readonly_fields = ['id', 'progress_id', 'ipfs_hash', 'blockchain_tx_id', 'blockchain_timestamp', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('progress_id', 'project', 'property', 'milestone_id')
        }),
        ('Content', {
            'fields': ('description', 'uploaded_by')
        }),
        ('Blockchain Data', {
            'fields': ('ipfs_hash', 'blockchain_tx_id', 'blockchain_timestamp')
        }),
        ('Metadata', {
            'fields': ('metadata',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(BlockchainDocument)
class BlockchainDocumentAdmin(admin.ModelAdmin):
    list_display = ['document_id', 'document_name', 'document_type', 'project', 'ipfs_hash', 'blockchain_tx_id', 'created_at', 'uploaded_by']
    list_filter = ['document_type', 'created_at', 'project']
    search_fields = ['document_id', 'document_name', 'ipfs_hash', 'blockchain_tx_id']
    readonly_fields = ['id', 'document_id', 'ipfs_hash', 'blockchain_tx_id', 'blockchain_timestamp', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('document_id', 'project', 'property')
        }),
        ('Document Details', {
            'fields': ('document_name', 'document_type', 'uploaded_by')
        }),
        ('Blockchain Data', {
            'fields': ('ipfs_hash', 'blockchain_tx_id', 'blockchain_timestamp')
        }),
        ('Metadata', {
            'fields': ('metadata',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
