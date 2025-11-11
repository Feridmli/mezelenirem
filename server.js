// server.js — BearHustle Backend 🦧
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { nanoid } from 'nanoid';
import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------- POSTGRES SETUP ----------
const connectionString = "postgresql://postgres:kamoazmiu123@db.wxyojhjoqosltdpmhqwb.supabase.co:5432/postgres";
const sql = postgres(connectionString);

// ---------- EXPRESS SETUP ----------
const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: '*' }));

const PORT = process.env.PORT || 3000;

// ---------- PATH ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- KONTRAKT ADRESSLƏRİ ----------
const NFT_CONTRACT_ADDRESS = "0x54a88333F6e7540eA982261301309048aC431eD5";
const PROXY_CONTRACT_ADDRESS = "0x9656448941C76B79A39BC4ad68f6fb9F01181EC7";

// ---------- STATİK FAYLLAR ----------
app.use(express.static(__dirname)); // index.html və SeaportUtils.js

// ---------- ROOT ROUTE ----------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ---------- POST /order ----------
app.post('/order', async (req, res) => {
  try {
    const { tokenId, price, sellerAddress, seaportOrder, orderHash } = req.body;

    if (!tokenId || !price || !sellerAddress || !seaportOrder)
      return res.status(400).json({ success: false, error: 'Missing parameters' });

    const id = nanoid();
    const createdAt = new Date().toISOString();

    await sql`
      INSERT INTO orders (
        id, tokenId, price, nftContract, marketplaceContract, seller, seaportOrder, orderHash, onChain, createdAt
      ) VALUES (
        ${id}, ${tokenId}, ${price}, ${NFT_CONTRACT_ADDRESS}, ${PROXY_CONTRACT_ADDRESS},
        ${sellerAddress.toLowerCase()}, ${JSON.stringify(seaportOrder)}, ${orderHash || null}, ${!!orderHash}, ${createdAt}
      )
    `;

    res.json({ success: true, order: { id, tokenId, price, seller: sellerAddress, createdAt } });
  } catch (e) {
    console.error('POST /order error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ---------- GET /orders/:address? ----------
app.get('/orders/:address?', async (req, res) => {
  try {
    const addr = req.params.address;

    let orders;
    if (addr) {
      orders = await sql`
        SELECT * FROM orders WHERE seller = ${addr.toLowerCase()} ORDER BY "createdAt" DESC
      `;
    } else {
      orders = await sql`
        SELECT * FROM orders ORDER BY "createdAt" DESC
      `;
    }

    res.json({ success: true, orders });
  } catch (e) {
    console.error('GET /orders error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ---------- SERVER START ----------
app.listen(PORT, () => console.log(`🚀 Backend ${PORT}-də işləyir`));