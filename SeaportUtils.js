import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js";
import WalletConnectProvider from "https://cdn.jsdelivr.net/npm/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js";
import { Seaport } from "https://cdn.jsdelivr.net/npm/@opensea/seaport-js@latest/dist/seaport.esm.min.js";

export const PROXY_ADDRESS = "0x9656448941C76B79A39BC4ad68f6fb9F01181EC7";
export const NFT_CONTRACT_ADDRESS = "0x54a88333F6e7540eA982261301309048aC431eD5";
const APECHAIN_ID = 33139;

export async function connectWallet() {
  let provider;
  try {
    if (window.ethereum) {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
    } else {
      const wcProvider = new WalletConnectProvider({
        rpc: { [APECHAIN_ID]: "https://rpc.apechain.com" },
        chainId: APECHAIN_ID,
        qrcode: true
      });
      await wcProvider.enable();
      provider = new ethers.providers.Web3Provider(wcProvider);
    }

    const signer = provider.getSigner();
    const address = await signer.getAddress();

    // ApeChain yoxlama və switch/add
    const network = await provider.getNetwork();
    if (network.chainId !== APECHAIN_ID) {
      try {
        await provider.send("wallet_switchEthereumChain", [{ chainId: "0x8163" }]);
      } catch(err) {
        if (err.code === 4902) {
          await provider.send("wallet_addEthereumChain", [{
            chainId: "0x8163",
            chainName: "ApeChain Mainnet",
            nativeCurrency: { name: "APE", symbol: "APE", decimals: 18 },
            rpcUrls: ["https://rpc.apechain.com"],
            blockExplorerUrls: ["https://apescan.io"]
          }]);
        } else throw err;
      }
    }

    const seaport = new Seaport(signer, { contractAddress: PROXY_ADDRESS });
    console.log("✅ Wallet qoşuldu:", address);

    return { provider, signer, address, seaport };
  } catch (err) {
    console.error("❌ Wallet qoşulma xətası:", err);
    throw err;
  }
}

export async function fulfillOrder(seaport, signer, order, options = {}) {
  if (!seaport) seaport = new Seaport(signer, { contractAddress: PROXY_ADDRESS });
  const tx = await seaport.fulfillOrder({
    order: order.seaportOrder,
    accountAddress: await signer.getAddress(),
    recipient: options.recipient || await signer.getAddress()
  });
  await tx.wait();
  return tx;
}

export function getNFTContractAddress() { return NFT_CONTRACT_ADDRESS; }