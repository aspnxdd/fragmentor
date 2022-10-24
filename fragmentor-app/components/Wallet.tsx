import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { FC } from "react";

const Wallet: FC = () => {
  return (
    <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        margin: 20,
    }}>
      <WalletMultiButton />
    </div>
  );
};

export default Wallet;
