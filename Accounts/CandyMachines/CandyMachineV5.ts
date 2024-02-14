import * as borsh from "@project-serum/borsh";
import * as CandyMachineDataV3 from "../../Types/CandyMachineDataV3"

export class CandyMachineV5 {
    static readonly discriminator = Buffer.from([193, 154, 145, 64, 82, 69, 127, 140]);

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
        borsh.option(borsh.publicKey(), "requiredSigned")
    ])
}