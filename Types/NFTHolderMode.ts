import * as borsh from "@project-serum/borsh";

export const GetLayout = (property?: string) => {
    return borsh.struct([
        borsh.publicKey("verifiedCreator"),
        borsh.u32("mintsPerNft")
    ], property)
}