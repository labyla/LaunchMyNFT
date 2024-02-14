import * as borsh from "@project-serum/borsh";
import * as WhitelistMode from "./WhitelistMode";

export const GetLayout = (property?: string) => {
    return borsh.struct([
        borsh.i64("start"),
        borsh.u64("price"),
        borsh.option(borsh.publicKey(), "currency"),
        WhitelistMode.GetLayout("whitelistMode"),
        borsh.str("name")
    ], property)
}