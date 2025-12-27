import { useEffect, useState } from "react";
import { getProvider } from "@/utils/web3";

export default function NetworkBadge() {
  const [network, setNetwork] = useState<string>("");

  const updateNetwork = async () => {
    const provider = getProvider();
    if (!provider) {
      setNetwork("No Provider");
      return;
    }
    try {
      const net = await provider.getNetwork();
      const networkName = getNetworkName(Number(net.chainId));
      console.log('Current network:', networkName);
      setNetwork(networkName);
    } catch (error) {
      console.error("Failed to get network:", error);
      setNetwork("Error");
    }
  };

  useEffect(() => {
    // 初始获取网络
    updateNetwork();

    // 监听网络变化
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      ethereum.on('chainChanged', updateNetwork);
      return () => {
        ethereum.removeListener('chainChanged', updateNetwork);
      };
    }
  }, []);

const getNetworkName = (id: number) => {
  switch (id) {
    case 1: return 'Mainnet';
    case 5: return 'Goerli (Testnet)';
    case 11155111: return 'Sepolia (Testnet)';
    case 137: return 'Polygon Mainnet';
    case 80001: return 'Mumbai (Testnet)';
    default: return `Chain  (${id})`;
  }
};

  return (
    <div className="inline-flex items-center px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 mt-2">
      <span className="mr-1">🌐</span>
      <span>Network: {network}</span>
    </div>
  );
}
