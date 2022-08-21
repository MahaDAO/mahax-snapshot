import * as fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import Web3 from "web3";
import { BigNumber } from "ethers";

const e18 = BigNumber.from(10).pow(18);
const web3 = new Web3();

type csvLine = {
  id: string;
  owner: string;
  amounte18: string;
  start: string;
  end: string;
  "start-d": string;
  "end-d": string;
  maha_reward: string;
  sclp_reward: string;
};

const result: csvLine[] = [];
const csvPath = path.resolve(__dirname, "./snapshot.csv");
const outputPath = path.resolve(__dirname, "../output/merkleProof.json");

const difference = (date1: Date, date2: Date) => {
  let difference = date1.getTime() - date2.getTime();

  const daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
  difference -= daysDifference * 1000 * 60 * 60 * 24;

  const hoursDifference = Math.floor(difference / 1000 / 60 / 60);
  difference -= hoursDifference * 1000 * 60 * 60;

  const minutesDifference = Math.floor(difference / 1000 / 60);
  difference -= minutesDifference * 1000 * 60;

  return daysDifference;
};

fs.createReadStream(csvPath)
  .pipe(csvParser())
  .on("data", (data: csvLine) => result.push(data))
  .on("end", () => {
    const constructArray = () =>
      result
        .filter((d) => Number(d.amounte18) > 0)
        .map((data) => {
          let dateValue;

          const endDate = Number(data.end) * 1000;
          const daysDiffCheck = difference(
            new Date(endDate),
            new Date(Date.now())
          );

          if (daysDiffCheck > 0) {
            if (daysDiffCheck < 15) {
              dateValue =
                new Date(endDate).setDate(new Date(endDate).getDate() + 15) /
                1000;
            } else dateValue = endDate / 1000;

            return {
              owner: data.owner,
              id: data.id,
              endDate: dateValue,
              amount: BigNumber.from(Math.floor(Number(data.amounte18)))
                .mul(e18)
                .toString(),
              mahaReward: BigNumber.from(Math.floor(Number(data.sclp_reward)))
                .mul(e18)
                .toString(),
              sclpReward: BigNumber.from(Math.floor(Number(data.maha_reward)))
                .mul(e18)
                .toString(),
            };
          }
        })
        .filter((d) => d != null);

    const arrayData = constructArray();
    const leaves = arrayData.map((item: any) =>
      keccak256(
        web3.eth.abi.encodeParameters(
          ["uint256", "uint256", "address", "uint256", "uint256", "uint256"],
          [
            item.amount,
            item.endDate,
            item.owner,
            item.id,
            item.mahaReward,
            item.sclpReward,
          ]
        )
      )
    );

    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });

    const ret = {
      root: merkleTree.getHexRoot(),
      leaves: arrayData.map((data, index) => ({
        data,
        proof: merkleTree.getHexProof(leaves[index]),
      })),
    };

    console.log("root", merkleTree.getHexRoot());
    fs.writeFileSync(outputPath, JSON.stringify(ret, null, 2));
    console.log("merkle tree written into", outputPath);
  });
