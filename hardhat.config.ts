import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-abi-exporter";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  abiExporter: {
    path: "./output/abis/",
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 2,
    pretty: true,
  },
  networks: {
    polygon: {
      url: "https://polygon-rpc.com/",
      accounts: [
        "e2e237c3a55d6f029b0bc48fb0f5a0b6285a11c1adae9bce6e92588f5e222222",
      ],
    },
  },
};

export default config;
