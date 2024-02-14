import * as borsh from "@project-serum/borsh";
import * as Creator from "./Creator";
import * as SaleFaze from "./SaleFaze";

export const GetLayout = (property?: string) => {
    return borsh.struct([
        borsh.u64("itemsAvailable"),
        borsh.i64("goLiveDate"),
        borsh.str("symbol"),
        borsh.u16("sellerFeeBasisPoints"),
        borsh.vec(Creator.GetLayout(), "creators"),
        borsh.bool("isMutable"),
        borsh.bool("retainAuthority"),
        borsh.str("baseUrl"),
        borsh.vec(SaleFaze.GetLayout(), "saleFazes")
    ], property)
}