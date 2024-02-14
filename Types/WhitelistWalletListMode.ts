import * as borsh from "@project-serum/borsh";

export const GetLayout = (property?: string) => {
    return borsh.struct([
        borsh.u32("mintsPerUser"), 
        borsh.array(borsh.u8(), 32, "merkleRoot")
    ], property)
}