import { useEffect, useState } from "react";
import { getProvider } from "@/utils/web3";

export default function NetworkBadge() {
  const [network, setNetwork] = useState<string>("");

  useEffect(() => {
    const loadNetwork = async () => {
      const provider = getProvider();
      if (!provider) return;

      const net = await provider.getNetwork();
      setNetwork(net.name);
    };

    loadNetwork();
  }, []);

  return (
    <div className="inline-block px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 mt-2">
      Network: {network || "Loading..."}
    </div>
  );
}
