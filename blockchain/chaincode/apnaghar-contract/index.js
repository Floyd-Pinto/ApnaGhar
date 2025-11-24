'use strict';

const { Contract } = require('fabric-contract-api');

class ApnaGharContract extends Contract {

    async InitLedger(ctx) {
        console.info('ApnaGhar Contract Initialized');
    }

    // Helper to get deterministic timestamp
    _getTimestamp(ctx) {
        const timestamp = ctx.stub.getTxTimestamp();
        return new Date(timestamp.seconds.low * 1000).toISOString();
    }

    // Property Management
    async CreateProperty(ctx, propertyId, projectId, unitNumber, owner, dataHash) {
        const timestamp = this._getTimestamp(ctx);
        const property = {
            docType: 'property',
            propertyId,
            projectId,
            unitNumber,
            owner,
            dataHash,
            status: 'created',
            createdAt: timestamp,
            updatedAt: timestamp
        };
        await ctx.stub.putState(propertyId, Buffer.from(JSON.stringify(property)));
        return JSON.stringify(property);
    }

    async UpdatePropertyStatus(ctx, propertyId, status, owner) {
        const propertyBytes = await ctx.stub.getState(propertyId);
        if (!propertyBytes || propertyBytes.length === 0) {
            throw new Error(`Property ${propertyId} does not exist`);
        }
        const property = JSON.parse(propertyBytes.toString());
        property.status = status;
        if (owner) property.owner = owner;
        property.updatedAt = this._getTimestamp(ctx);

        await ctx.stub.putState(propertyId, Buffer.from(JSON.stringify(property)));
        return JSON.stringify(property);
    }

    // Construction Milestones
    async RecordMilestone(ctx, milestoneId, projectId, title, status, ipfsHash, verifier) {
        const milestone = {
            docType: 'milestone',
            milestoneId,
            projectId,
            title,
            status,
            ipfsHash,
            verifier,
            timestamp: this._getTimestamp(ctx)
        };
        await ctx.stub.putState(milestoneId, Buffer.from(JSON.stringify(milestone)));
        return JSON.stringify(milestone);
    }

    // Document Management
    async StoreDocument(ctx, documentId, projectId, docType, ipfsHash, owner) {
        const document = {
            docType: 'document',
            documentId,
            projectId,
            docType,
            ipfsHash,
            owner,
            timestamp: this._getTimestamp(ctx)
        };
        await ctx.stub.putState(documentId, Buffer.from(JSON.stringify(document)));
        return JSON.stringify(document);
    }

    // Generic Query
    async ReadAsset(ctx, id) {
        const assetBytes = await ctx.stub.getState(id);
        if (!assetBytes || assetBytes.length === 0) {
            throw new Error(`Asset ${id} does not exist`);
        }
        return assetBytes.toString();
    }

    // History
    async GetAssetHistory(ctx, id) {
        const iterator = await ctx.stub.getHistoryForKey(id);
        const result = [];
        let res = await iterator.next();
        while (!res.done) {
            if (res.value) {
                const obj = {
                    txId: res.value.txId,
                    timestamp: new Date(res.value.timestamp.seconds.low * 1000).toISOString(),
                    isDelete: res.value.isDelete,
                    value: ''
                };
                if (!res.value.isDelete) {
                    obj.value = res.value.value.toString('utf8');
                }
                result.push(obj);
            }
            res = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(result);
    }
}

module.exports = ApnaGharContract;
