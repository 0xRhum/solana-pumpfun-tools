## Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/solana-pump-tools.git
cd solana-pump-tools
```

2. Install dependencies:
```bash
npm install @solana/web3.js@1.87.6
npm install bs58@5.0.0
npm install dotenv@16.3.1
npm install formdata-node@5.0.1
npm install node-fetch@3.3.2
npm install ws@8.14.2
```

Or simply:
```bash
npm install
```

## Configuration

1. Create a `.env` file in the root directory:
```bash
touch .env
```

2. Add your private keys to the `.env` file:
```env
# Private key for trading operations (base58 encoded)
PKEYPUMP=your_private_key_for_trading

# Private keys for token creation and bundled transactions
PKEYPUMP1=your_private_key_for_token_creation
PKEYPUMP2=your_private_key_for_bundled_tx

# Optional: Custom RPC endpoint (default: mainnet-beta)
RPC_ENDPOINT=https://your-custom-rpc.com
```

3. Set proper permissions:
```bash
chmod 600 .env
```

## Usage

### Monitor New Tokens
```bash
# Start the WebSocket listener
node newTokens.js

# Expected output:
# Connected to Pump.fun WebSocket
# Subscribed to new tokens. Waiting...
# 
# === New Token Detected ===
# Address: TokenAddressHere
# Name: Token Name
# Timestamp: YYYY-MM-DD HH:mm:ss
# ===========================
```

### Execute Trades

#### Buy Tokens
```bash
# Format:
node tradePump.js buy <token_address> <sol_amount> [slippage]

# Examples:
# Buy for 0.1 SOL with default slippage (1%)
node tradePump.js buy TokenAddressHere 0.1

# Buy for 0.5 SOL with 2% slippage
node tradePump.js buy TokenAddressHere 0.5 2

# Expected output:
# Preparing transaction...
# Action: buy
# Token: TokenAddressHere
# Amount: 0.5 SOL
# Slippage: 2%
# Priority Fee: 0.005 SOL
# Transaction sent: https://solscan.io/tx/...
```

#### Sell Tokens
```bash
# Format:
node tradePump.js sell <token_address> <percentage> [slippage]

# Examples:
# Sell 100% of tokens with default slippage
node tradePump.js sell TokenAddressHere 100

# Sell 50% of tokens with 2% slippage
node tradePump.js sell TokenAddressHere 50 2

# Expected output:
# Preparing transaction...
# Action: sell
# Token: TokenAddressHere
# Amount: 50%
# Slippage: 2%
# Priority Fee: 0.005 SOL
# Transaction sent: https://solscan.io/tx/...
```

#### Create Token Bundle
```bash
# Format:
node createTokenBundle.js <name> <symbol> <description> <image_path>

# Example:
node createTokenBundle.js "My Token" "MTK" "A new Solana token" "./image.png"

# Expected output:
# Preparing token creation...
# Token address: NewTokenAddressHere
# Uploading metadata to IPFS...
# Sending bundle to PumpPortal...
# Transactions generated, signing...
# Sending bundle to Jito...
# Bundle status: 200
# Creation transaction: https://solscan.io/tx/...
# Buy transaction: https://solscan.io/tx/...
# Created token address: NewTokenAddressHere
```

### Advanced Configuration

You can modify the following parameters in each script:

1. In `createTokenBundle.js`:
```javascript
const CONFIG = {
    token: {
        name: "name",
        symbol: "TICKER",
        description: "description",
        twitter: "https://x.com/",
        imagePath: "./image.png"
    },
    network: {
        rpcEndpoint: "https://api.mainnet-beta.solana.com",
        connectionConfirmation: 'confirmed'
    },
    transaction: {
        createAmount: 1.25,
        buyAmount: 2,
        slippage: 1,
        priorityFeeCreate: 0.009,
        priorityFeeBuy: 0.0
    }
};
```

2. In `tradePump.js`:
```javascript
const DEFAULT_SLIPPAGE = 1;
const DEFAULT_PRIORITY_FEE = 0.005;
```
