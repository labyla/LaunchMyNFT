import * as CandyMachines from "../Accounts/CandyMachines";

const CandyMachineVersions = {
    V2: CandyMachines.CandyMachineV2.discriminator,
    V3: CandyMachines.CandyMachineV3.discriminator,
    V4: CandyMachines.CandyMachineV4.discriminator,
    V5: CandyMachines.CandyMachineV5.discriminator,
    V6: CandyMachines.CandyMachineV6.discriminator,
    Compressed: CandyMachines.CandyMachineCompressed.discriminator
}

export class CandyMachine {
    readonly Version: string;
    readonly Data;

    constructor(version: string, data: object) {
        this.Version = version;
        this.Data = data;
    }
}

export const GetCandyMachine = (CandyMachineAccountData: Buffer): CandyMachine => {
    switch(CandyMachineAccountData.subarray(0, 8).toString()) {
        case CandyMachineVersions.V2.toString():
            throw new Error("Unsupported Candy Machine Version: V2");
        case CandyMachineVersions.V3.toString():
            throw new Error("Unsupported Candy Machine Version: V3");
        case CandyMachineVersions.V4.toString():
            throw new Error("Unsupported Candy Machine Version: V4");
        case CandyMachineVersions.V5.toString():
            return new CandyMachine("V5", CandyMachines.CandyMachineV5.layout.decode(CandyMachineAccountData.slice(8)));
        case CandyMachineVersions.V6.toString():
            return new CandyMachine("V6", CandyMachines.CandyMachineV6.layout.decode(CandyMachineAccountData.slice(8)));
        case CandyMachineVersions.Compressed.toString():
            return new CandyMachine("Compressed", CandyMachines.CandyMachineCompressed.layout.decode(CandyMachineAccountData.slice(8)));
        default:
            throw new Error("Invalid Account of Candy Machine");
    }
}