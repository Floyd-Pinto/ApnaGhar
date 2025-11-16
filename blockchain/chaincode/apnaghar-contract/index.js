/*
 * ApnaGhar Smart Contract for Hyperledger Fabric
 * 
 * This chaincode provides immutable storage for:
 * 1. Construction Progress Tracking (photos + milestone descriptions)
 * 2. Secure Document Management (legal documents)
 * 
 * All files are stored on IPFS (Pinata), and only the IPFS hash is stored on-chain.
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class ApnaGharContract extends Contract {
    /**
     * Initialize the contract
     */
    async Init(ctx) {
        console.info('ApnaGhar Contract initialized');
    }

    /**
     * Store a construction progress update
     * @param {Context} ctx - Transaction context
     * @param {String} progressId - Unique identifier for this progress update
     * @param {String} projectId - Project ID
     * @param {String} propertyId - Property/Unit ID
     * @param {String} milestoneId - Milestone ID (optional)
     * @param {String} ipfsHash - IPFS hash of the uploaded file (photo/video)
     * @param {String} description - Milestone description
     * @param {String} uploadedBy - User ID who uploaded
     * @param {String} timestamp - ISO timestamp
     * @param {String} metadata - Additional metadata (JSON string)
     */
    async StoreProgressUpdate(ctx, progressId, projectId, propertyId, milestoneId, ipfsHash, description, uploadedBy, timestamp, metadata = '{}') {
        // Validate inputs
        if (!progressId || !projectId || !propertyId || !ipfsHash || !description || !uploadedBy || !timestamp) {
            throw new Error('Missing required parameters');
        }

        // Check if progress update already exists
        const existing = await ctx.stub.getState(progressId);
        if (existing && existing.length > 0) {
            throw new Error(`Progress update ${progressId} already exists`);
        }

        // Create progress update object
        const progressUpdate = {
            docType: 'progressUpdate',
            progressId: progressId,
            projectId: projectId,
            propertyId: propertyId,
            milestoneId: milestoneId || '',
            ipfsHash: ipfsHash,
            description: description,
            uploadedBy: uploadedBy,
            timestamp: timestamp,
            metadata: metadata,
            createdAt: new Date().toISOString()
        };

        // Store in ledger
        await ctx.stub.putState(progressId, Buffer.from(JSON.stringify(progressUpdate)));

        // Create composite key for querying by project
        const projectKey = ctx.stub.createCompositeKey('project~property~progress', [projectId, propertyId, progressId]);
        await ctx.stub.putState(projectKey, Buffer.from('\u0000'));

        // Create composite key for querying by property
        const propertyKey = ctx.stub.createCompositeKey('property~progress', [propertyId, progressId]);
        await ctx.stub.putState(propertyKey, Buffer.from('\u0000'));

        console.info(`Progress update ${progressId} stored successfully`);
        return JSON.stringify(progressUpdate);
    }

    /**
     * Store a legal document
     * @param {Context} ctx - Transaction context
     * @param {String} documentId - Unique identifier for this document
     * @param {String} projectId - Project ID
     * @param {String} propertyId - Property/Unit ID (optional)
     * @param {String} documentName - Name of the document
     * @param {String} documentType - Type of document (e.g., 'contract', 'agreement', 'certificate')
     * @param {String} ipfsHash - IPFS hash of the uploaded document
     * @param {String} uploadedBy - User ID who uploaded
     * @param {String} timestamp - ISO timestamp
     * @param {String} metadata - Additional metadata (JSON string)
     */
    async StoreDocument(ctx, documentId, projectId, propertyId, documentName, documentType, ipfsHash, uploadedBy, timestamp, metadata = '{}') {
        // Validate inputs
        if (!documentId || !projectId || !documentName || !documentType || !ipfsHash || !uploadedBy || !timestamp) {
            throw new Error('Missing required parameters');
        }

        // Check if document already exists
        const existing = await ctx.stub.getState(documentId);
        if (existing && existing.length > 0) {
            throw new Error(`Document ${documentId} already exists`);
        }

        // Create document object
        const document = {
            docType: 'document',
            documentId: documentId,
            projectId: projectId,
            propertyId: propertyId || '',
            documentName: documentName,
            documentType: documentType,
            ipfsHash: ipfsHash,
            uploadedBy: uploadedBy,
            timestamp: timestamp,
            metadata: metadata,
            createdAt: new Date().toISOString()
        };

        // Store in ledger
        await ctx.stub.putState(documentId, ctx.stub.createCompositeKey('document', [documentId]));
        await ctx.stub.putState(documentId, Buffer.from(JSON.stringify(document)));

        // Create composite key for querying by project
        const projectKey = ctx.stub.createCompositeKey('project~document', [projectId, documentId]);
        await ctx.stub.putState(projectKey, Buffer.from('\u0000'));

        // Create composite key for querying by document type
        const typeKey = ctx.stub.createCompositeKey('documentType~document', [documentType, documentId]);
        await ctx.stub.putState(typeKey, Buffer.from('\u0000'));

        console.info(`Document ${documentId} stored successfully`);
        return JSON.stringify(document);
    }

    /**
     * Get a progress update by ID
     * @param {Context} ctx - Transaction context
     * @param {String} progressId - Progress update ID
     */
    async GetProgressUpdate(ctx, progressId) {
        const progressBytes = await ctx.stub.getState(progressId);
        if (!progressBytes || progressBytes.length === 0) {
            throw new Error(`Progress update ${progressId} does not exist`);
        }
        return progressBytes.toString();
    }

    /**
     * Get a document by ID
     * @param {Context} ctx - Transaction context
     * @param {String} documentId - Document ID
     */
    async GetDocument(ctx, documentId) {
        const documentBytes = await ctx.stub.getState(documentId);
        if (!documentBytes || documentBytes.length === 0) {
            throw new Error(`Document ${documentId} does not exist`);
        }
        return documentBytes.toString();
    }

    /**
     * Query all progress updates for a property
     * @param {Context} ctx - Transaction context
     * @param {String} propertyId - Property ID
     */
    async QueryProgressUpdatesByProperty(ctx, propertyId) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('property~progress', [propertyId]);
        return await this._getAllResults(iterator, true);
    }

    /**
     * Query all progress updates for a project
     * @param {Context} ctx - Transaction context
     * @param {String} projectId - Project ID
     */
    async QueryProgressUpdatesByProject(ctx, projectId) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('project~property~progress', [projectId]);
        return await this._getAllResults(iterator, true);
    }

    /**
     * Query all documents for a project
     * @param {Context} ctx - Transaction context
     * @param {String} projectId - Project ID
     */
    async QueryDocumentsByProject(ctx, projectId) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('project~document', [projectId]);
        return await this._getAllResults(iterator, true);
    }

    /**
     * Query documents by type
     * @param {Context} ctx - Transaction context
     * @param {String} documentType - Document type
     */
    async QueryDocumentsByType(ctx, documentType) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('documentType~document', [documentType]);
        return await this._getAllResults(iterator, true);
    }

    /**
     * Get all progress updates (for admin/debugging)
     * @param {Context} ctx - Transaction context
     */
    async GetAllProgressUpdates(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        return await this._getAllResults(iterator, false);
    }

    /**
     * Get all documents (for admin/debugging)
     * @param {Context} ctx - Transaction context
     */
    async GetAllDocuments(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        return await this._getAllResults(iterator, false);
    }

    /**
     * Helper method to get all results from an iterator
     * @private
     */
    async _getAllResults(iterator, isHistory) {
        const allResults = [];
        let res = await iterator.next();
        while (!res.done) {
            if (res.value && res.value.value.toString()) {
                const jsonRes = {};
                console.log(res.value.value.toString('utf8'));
                try {
                    jsonRes.Key = res.value.key;
                    if (isHistory && res.value.isDelete) {
                        jsonRes.IsDelete = res.value.isDelete.toString();
                    }
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                    allResults.push(jsonRes);
                } catch (err) {
                    console.log(err);
                    jsonRes.Key = res.value.key;
                    jsonRes.Record = res.value.value.toString('utf8');
                    allResults.push(jsonRes);
                }
            }
            res = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(allResults);
    }
}

// Export contract for both traditional and CCAAS modes  
// For CCAAS, fabric-contract-api automatically starts a server 
// when CHAINCODE_SERVER_ADDRESS environment variable is set
module.exports.ApnaGharContract = ApnaGharContract;
module.exports.contracts = [ApnaGharContract];

