import * as borsh from "@project-serum/borsh";
import * as CandyMachineDataV3 from "../../Types/CandyMachineDataV3"

export class CandyMachineV6 {
    static readonly discriminator = Buffer.from([196, 204, 36, 6, 18, 215, 199, 134]);

    static readonly layout = borsh.struct([
        borsh.publicKey("seed"),
        borsh.u8("bump"),
        borsh.publicKey("authority"),
        borsh.publicKey("wallet"),
        borsh.u64("itemsRedeemed"),
        borsh.option(borsh.i64(), "thawDate"),
        borsh.bool("allowThaw"),
        borsh.option(borsh.str(), "revealedUri"),
        CandyMachineDataV3.GetLayout("data"),
        borsh.option(borsh.publicKey(), "requiredSigned"),
        borsh.str("name"),
        borsh.bool("enforceRoyalties"),
        borsh.option(borsh.publicKey(), "collectionMint")
    ])
}