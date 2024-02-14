import * as borsh from "@project-serum/borsh";
import * as WhitelistWalletListMode from "./WhitelistWalletListMode";
import * as WhitelistTokenMode from "./WhitelistTokenMode";
import * as PublicMode from "./PublicMode";
import * as NFTHolderMode from "./NFTHolderMode";

export const GetLayout = (property?: string) => {
    const Enum = borsh.rustEnum([
        borsh.struct([WhitelistWalletListMode.GetLayout("info")], "WalletBased"),
        borsh.struct([WhitelistTokenMode.GetLayout("info")], "TokenBased"),
        borsh.struct([PublicMode.GetLayout("info")], "Public"),
        borsh.struct([NFTHolderMode.GetLayout("info")], "NFTBased")
    ])

    if (property !== undefined) {
        return Enum.replicate(property);
    }

    return Enum;
}