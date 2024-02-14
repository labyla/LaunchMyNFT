import * as borsh from "@project-serum/borsh";
import * as SaleFaze from "../../Types/SaleFaze";
import * as Creator from "../../Types/CreatorCompressed";

export class CandyMachineCompressed {
    static readonly discriminator = Buffer.from([28, 69, 107, 166, 41, 139, 205, 247]);

    static readonly layout = borsh.struct([
        borsh.u8("bump"),
        borsh.publicKey("seed"),
        borsh.publicKey("authority"),
        borsh.bool("ordered"),
        borsh.str("name"),
        borsh.str("url"),
        borsh.str("symbol"),
        borsh.vec(Creator.GetLayout(), "creators"),
        borsh.u16("sellerFeeBasisPoints"),
        borsh.u32("supply"),
        borsh.u32("sold"),
        borsh.publicKey("collectionMint"),
        borsh.vec(SaleFaze.GetLayout(), "saleFazes")
    ])
}