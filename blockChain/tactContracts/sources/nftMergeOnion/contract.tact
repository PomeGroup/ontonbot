import "@stdlib/ownable";

///**
// * We'll define:
// *   1) A dictionary: index -> color
// *   2) A new message setIndexColor(index, color) to fill or update that dictionary
// *   3) A get_color(index) method for reading it
// *
// * We'll also keep your existing SendNFT and Merge logic
//*/

// A helper function for your existing checks
fun requireNFT(cond: Bool, code: Int) {
    if (!cond) {
        throw(code);
    }
}

// We'll define your existing messages
message(0x1) SendNFT {
    color: String
}
message(0x2) Merge {}

// New message for populating the data set one entry at a time
message(0x3) SetIndexColor {
    index: Int;
color: String
}

contract NftMergeOnionContract(
owner: Address,
hasGold: Bool,
hasSilver: Bool,
hasBronze: Bool
) with Ownable {

//------------------------------------------------------------
// 1) Dictionary: itemIndex -> color
//------------------------------------------------------------
dict: IndexToColor <Int, String> = dict();

//------------------------------------------------------------
// Fallback receive: bounce coins
//------------------------------------------------------------
receive() {
cashback(sender());
}

//------------------------------------------------------------
// 2) (Unchanged) - The user sends an NFT by calling SendNFT(color)
//    Only the owner can do this. We do simple color checks.
//------------------------------------------------------------
receive(msg: SendNFT) {
self.requireOwner();

// Check color
if (msg.color == "Gold") {
requireNFT(!self.hasGold, 101);
self.hasGold = true;
} else if (msg.color == "Silver") {
requireNFT(!self.hasSilver, 102);
self.hasSilver = true;
} else if (msg.color == "Bronze") {
requireNFT(!self.hasBronze, 103);
self.hasBronze = true;
} else {
// unrecognized color
throw(104);
}
}

//------------------------------------------------------------
// 3) (Unchanged) - Merge method. Requires we have G/S/B => reset them
//------------------------------------------------------------
receive(_: Merge) {
self.requireOwner();
requireNFT(self.hasGold && self.hasSilver && self.hasBronze, 105);

// For demonstration, just clear flags
self.hasGold = false;
self.hasSilver = false;
self.hasBronze = false;
}

//------------------------------------------------------------
// 4) New method: "setIndexColor(index, color)"
//    The owner can store or update a data set entry in the dictionary.
//------------------------------------------------------------

receive(msg: SetIndexColor) {
self.requireOwner();
indexToColor.replace(msg.index, msg.color);
}

//------------------------------------------------------------
// 5) GET method to read color from the dictionary
//    e.g. "get_color(123)" => "Gold"
//------------------------------------------------------------
get fun get_color(index: Int): String {
var colorOpt = indexToColor.fetch(index);
if null?(colorOpt) {
return "Unknown";
}
return slice_to_string(colorOpt);
}

//------------------------------------------------------------
// 6) (Unchanged) - GET methods for hasGold/hasSilver/hasBronze
//------------------------------------------------------------
get fun has_gold(): Bool {
return self.hasGold;
}
get fun has_silver(): Bool {
return self.hasSilver;
}
get fun has_bronze(): Bool {
return self.hasBronze;
}
}
