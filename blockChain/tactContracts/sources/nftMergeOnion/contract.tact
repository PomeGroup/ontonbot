import "@stdlib/ownable";
import "@stdlib/dict";



// A helper check
fun requireNFT(cond: Bool, code: Int) {
if (!cond) {
throw(code);
}
}

// Messages
message(1) SendNFT {
color: String;
}

message(2) Merge {}

message(3) SetIndexColor {
index: Int;
color: String;
}

contract NftMergeOnionContract(
owner: Address,
hasGold: Bool,
hasSilver: Bool,
hasBronze: Bool
) with Ownable {

//------------------------------------------------------------
// Dictionary: we store (index: Int -> cell).
// We'll interpret that cell as a string for the color.
//------------------------------------------------------------
dict indexToColor: Int -> cell = dict();

//------------------------------------------------------------
// fallback: bounce coins
//------------------------------------------------------------
receive() {
cashback(sender());
}

//------------------------------------------------------------
// 1) SendNFT (unchanged from your snippet)
//------------------------------------------------------------
receive(msg: SendNFT) {
self.requireOwner();

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
throw(104);
}
}

//------------------------------------------------------------
// 2) Merge (unchanged from your snippet)
//------------------------------------------------------------
receive(_: Merge) {
self.requireOwner();
requireNFT(self.hasGold && self.hasSilver && self.hasBronze, 105);

self.hasGold = false;
self.hasSilver = false;
self.hasBronze = false;
}

//------------------------------------------------------------
// 3) setIndexColor => let the owner store "index -> color"
//------------------------------------------------------------
receive(msg: SetIndexColor) {
self.requireOwner();
;; Convert color string to a slice/cell
var colorSlice = string_to_slice(msg.color);

;; Put it in the dictionary
dict_set(indexToColor, msg.index, colorSlice);
}

//------------------------------------------------------------
// GET method => retrieve color by index
// If not found, return "Unknown"
//------------------------------------------------------------
get fun get_color(index: Int): String {
var stored = dict_fetch(indexToColor, index);
if (null?(stored)) {
return "Unknown";
}
return slice_to_string(stored);
}

//------------------------------------------------------------
// 4) existing GET bools
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
