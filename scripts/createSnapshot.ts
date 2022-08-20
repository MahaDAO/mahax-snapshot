import * as fs from "fs";
import path from "path";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

function padTo2Digits(num: number) {
  return num.toString().padStart(2, "0");
}

function formatDate(_date: BigNumber) {
  const date = new Date(_date.toNumber() * 1000);
  return [
    padTo2Digits(date.getDate()),
    padTo2Digits(date.getMonth() + 1),
    date.getFullYear(),
  ].join("/");
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Using wallet address: ${deployer.address}.`);

  const DEPLOYED_MAHAX = "0x5ce7F38dFF1ff187e80A41D710f32c2Bb1bA87b7";

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(5).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  const abiPath = path.resolve(__dirname, "../output/abis/IVotingEscrow.json");
  const IVotingEscrow = fs.readFileSync(abiPath).toString();

  const IVotingEscrowInterface = new ethers.utils.Interface(IVotingEscrow);
  const mahax = new ethers.Contract(
    DEPLOYED_MAHAX,
    IVotingEscrowInterface,
    deployer
  );

  const lastNFTId = 600;
  const e18 = BigNumber.from(10).pow(18);

  let data = "id,owner,amounte18,mahax18,start,end,start-d,end-d\n";
  for (let i = 370; i <= lastNFTId; i++) {
    console.log(`Fetching lock details for ${i}`);
    const [amount, end, start] = await mahax.locked(i);
    const owner = await mahax.ownerOf(i);
    if (amount.eq(0)) continue;

    const amounte18 = amount.mul(1000).div(e18).toNumber() / 1000;

    data += `${i},${owner},${amounte18},${start.toString()},${end.toString()},`;
    data += `${formatDate(start)},${formatDate(end)}\n`;

    fs.writeFileSync(`./output/snapshot.csv`, data);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
