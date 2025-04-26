import "@stdlib/ownable";

/**
 * We define 3 lists (cells) storing indexes for Gold, Silver, Bronze
* Each cell begins with a length (64 bits), then that many indexes (64 bits each
* Then we provide get methods to read them as a comma-separated string
*/

// The user’s existing messages
message(1) SendNFT {
color: String;
}

message(2) Merge {}

/**
 * A helper function for color checks
* We declare it "internal" so it doesn't appear as a method
*/
fun requireNFT(cond: Bool, code: Int) {
if (!cond) {
throw(code);
}
}

/**
 * The main contract
*/
contract NftMergeOnionContract(
owner: Address,
hasGold: Bool,
hasSilver: Bool,
hasBronze: Bool
) with Ownable {

//------------------------------------------------------------------
// 1) Hardcoded arrays of indexes stored in cells
//    Suppose each list has 3 indexes.
//------------------------------------------------------------------
let goldIndexes: cell = begin_cell()
.store_uint(3, 64)   // length=3
.store_int(101, 64)
.store_int(102, 64)
.store_int(103, 64)
.end_cell();

let silverIndexes: cell = begin_cell()
.store_uint(2, 64)  // length=2
.store_int(201, 64)
.store_int(202, 64)
.end_cell();

let bronzeIndexes: cell = begin_cell()
.store_uint(3, 64)  // length=3
.store_int(301, 64)
.store_int(302, 64)
.store_int(303, 64)
.end_cell();

//------------------------------------------------------------------
// fallback => bounce coins
//------------------------------------------------------------------
receive() {
cashback(sender());
}

//------------------------------------------------------------------
// 2) Existing method: SendNFT(color)
//    Only the owner can call it
//------------------------------------------------------------------
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

//------------------------------------------------------------------
// 3) Existing method: Merge()
//    If has G/S/B, reset them
//------------------------------------------------------------------
receive(_: Merge) {
self.requireOwner();
requireNFT(self.hasGold && self.hasSilver && self.hasBronze, 105);

// For demonstration, just clear flags
self.hasGold = false;
self.hasSilver = false;
self.hasBronze = false;
}

//------------------------------------------------------------------
// 4) GET methods to read each list of indexes
//    We parse the cell => load length => load that many 64-bit indexes
//    returning them in a CSV string
//------------------------------------------------------------------
get fun get_gold_indexes(): String {
return parseIndexList(goldIndexes);
}

get fun get_silver_indexes(): String {
return parseIndexList(silverIndexes);
}

get fun get_bronze_indexes(): String {
return parseIndexList(bronzeIndexes);
}

    /**
     * parseIndexList(listCell) => read length, read indexes, return CSV
* Keep it "internal" so Tact won't expose it as a method
*/
internal fun parseIndexList(listCell: cell): String {
var s = listCell.begin_parse();
var length = s.load_uint(64);

var result = "";
for (i in 0..length-1) {
// load next 64-bit index
var idx = s.load_int(64);
var idxStr = int_to_string(idx);
if i == 0 {
result = idxStr;
} else {
result = result + "," + idxStr;
}
}
return result;
}
}
