package highload

import (
	"context"
	"encoding/base64"
	"log"
	"strings"

	"github.com/xssnick/tonutils-go/address"
	"github.com/xssnick/tonutils-go/liteclient"
	"github.com/xssnick/tonutils-go/tlb"
	"github.com/xssnick/tonutils-go/ton"
	"github.com/xssnick/tonutils-go/ton/wallet"
	"github.com/xssnick/tonutils-go/tvm/cell"
)

var (
	client *liteclient.ConnectionPool
	api    *ton.APIClient
)

func init() {
	initializeApp()
}

func CreateWallet() (string, string, error) {
	words := wallet.NewSeed()

	w, err := wallet.FromSeed(api, words, wallet.HighloadV2R2)
	if err != nil {
		return "", "", err
	}

	walletAddress := w.Address()
	seedWords := strings.Join(words, " ")

	return walletAddress.String(), seedWords, nil
}

func Withdraw(seedPhrase string, addressString string) error {
	w, err := wallet.FromSeed(api, strings.Split(seedPhrase, " "), wallet.HighloadV2R2)
	if err != nil {
		return err
	}

	amount := tlb.MustFromTON("0.1")
	comment, err := wallet.CreateCommentCell("Withdraw")
	if err != nil {
		return err
	}

	message := &wallet.Message{
		Mode: uint8(128),
		InternalMessage: &tlb.InternalMessage{
			Bounce:  false,
			DstAddr: address.MustParseAddr(addressString),
			Amount:  amount,
			Body:    comment,
		},
	}

	log.Println("Sending transaction and waiting for confirmation...")

	txHash, err := w.SendManyWaitTxHash(context.Background(), []*wallet.Message{message})
	if err != nil {
		return err
	}

	log.Println("Transaction sent. Explorer link: https://tonscan.org/tx/" + base64.URLEncoding.EncodeToString(txHash))

	return nil
}

func initializeApp() {
	client = liteclient.NewConnectionPool()

	err := client.AddConnectionsFromConfigFile("./config.json")
	if err != nil {
		log.Fatalln("connection err: ", err.Error())
		return
	}

	api = ton.NewAPIClient(client)
}

func SendTransactions(seedPhrase string, commentText string, txs map[string]string, mode int64) error {
	w, err := wallet.FromSeed(api, strings.Split(seedPhrase, " "), wallet.HighloadV2R2)
	if err != nil {
		return err
	}

	comment, err := wallet.CreateCommentCell(commentText)
	if err != nil {
		return err
	}

	messages := createMessages(comment, txs, mode)

	log.Println("Sending transaction and waiting for confirmation...")

	txHash, err := w.SendManyWaitTxHash(context.Background(), messages)
	if err != nil {
		return err
	}

	log.Println("Transaction sent. Explorer link: https://tonscan.org/tx/" + base64.URLEncoding.EncodeToString(txHash))

	return nil
}

// func calculateTotalAmount(txs map[string]string) (uint64, error) {
// 	var totalAmount float64
// 	for _, amtStr := range txs {
// 		amtFloat, err := strconv.ParseFloat(amtStr, 64)
// 		if err != nil {
// 			return 0, err
// 		}
// 		totalAmount += amtFloat
// 	}

// 	return uint64(totalAmount * 1e9), nil
// }

func createMessages(comment *cell.Cell, txs map[string]string, mode int64) []*wallet.Message {
	var messages []*wallet.Message
	for addrStr, amtStr := range txs {
		messages = append(messages, &wallet.Message{
			Mode: uint8(mode),
			InternalMessage: &tlb.InternalMessage{
				Bounce:  false,
				DstAddr: address.MustParseAddr(addrStr),
				Amount:  tlb.MustFromTON(amtStr),
				Body:    comment,
			},
		})
	}
	return messages
}
