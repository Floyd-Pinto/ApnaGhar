#!/bin/sh
set -e

# Default values
CORE_PEER_TLS_ENABLED=${CORE_PEER_TLS_ENABLED:-"false"}
DEBUG=${DEBUG:-"false"}

# If CHAINCODE_SERVER_ADDRESS is set, start chaincode as a service (CCAAS)
if [ -n "$CHAINCODE_SERVER_ADDRESS" ]; then
    echo "Starting chaincode server on $CHAINCODE_SERVER_ADDRESS..."
    echo "CHAINCODE_ID: $CHAINCODE_ID"
    echo "CORE_CHAINCODE_ID_NAME: $CORE_CHAINCODE_ID_NAME"
    
    # Convert to lowercase for comparison (sh-compatible)
    DEBUG_LOWER=$(echo "$DEBUG" | tr '[:upper:]' '[:lower:]')
    
    if [ "$DEBUG_LOWER" = "true" ]; then
        echo "Starting in debug mode..."
        exec npx fabric-chaincode-node server --chaincode-address="$CHAINCODE_SERVER_ADDRESS" --chaincode-id="$CORE_CHAINCODE_ID_NAME" --inspect=0.0.0.0:9229
    else
        echo "Starting chaincode server (CCAAS mode)..."
        # Use fabric-chaincode-node server for CCAAS mode
        exec npx fabric-chaincode-node server --chaincode-address="$CHAINCODE_SERVER_ADDRESS" --chaincode-id="$CORE_CHAINCODE_ID_NAME"
    fi
else
    echo "Error: CHAINCODE_SERVER_ADDRESS not set"
    exit 1
fi
