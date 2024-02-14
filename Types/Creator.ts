import * as borsh from "@project-serum/borsh";

export const GetLayout = (property?: string) => {
    return borsh.struct([
        borsh.publicKey("address"),
        borsh.bool("verified"),
        borsh.u8("share")
    ], property)
}