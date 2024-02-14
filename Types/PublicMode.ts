import * as borsh from "@project-serum/borsh";

export const GetLayout = (property?: string) => {
    return borsh.struct([
        borsh.option(borsh.u32(), "mintsPerUser")
    ], property)
}