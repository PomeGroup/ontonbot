package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"

	"github.com/hibiken/asynq"
	"github.com/tonft-app/highload-wallet-server/highload"
)

type Body struct {
	Receivers map[string]string `json:"receivers"`
}

var (
	flagRedisAddr = flag.String("redis-addr", "redis:6379", "Redis server address")
	c             = asynq.NewClient(asynq.RedisClientOpt{Addr: *flagRedisAddr})
)

var BEARER_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb29tX2hhc2giOiJiZWFyZXIiLCJ1c2VyX2lkIjoiMTIzNDU2Nzg5MCIsImV4cCI6MTYx"

func isAuthorizedMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")

		if token != BEARER_TOKEN {
			fmt.Println("Unauthorized access to this resource")
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func sendHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	seedPhrase := r.URL.Query().Get("seed_phrase")

	log.Println("Seed phrase:", seedPhrase)
	log.Println("Receivers:", r.Body)

	var body Body
	err := json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		fmt.Println("Error parsing body:", err.Error())
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	log.Println("Receivers:", body.Receivers)

	const batchSize = 100
	batch := make(map[string]string)
	count := 0

	for address, amount := range body.Receivers {
		batch[address] = amount
		count++

		if count >= batchSize {
			enqueueSendTask(batch, seedPhrase, 1)
			batch = make(map[string]string)
			count = 0
		}
	}

	if count > 0 {
		enqueueSendTask(batch, seedPhrase, 1)
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Data processed successfully")
}

func enqueueSendTask(batch map[string]string, seedPhrase string, mode int64) {
	payload, err := json.Marshal(map[string]interface{}{
		"seed_phrase": seedPhrase,
		"receivers":   batch,
		"mode":        mode,
	})
	if err != nil {
		log.Fatalf("Failed to marshal payload: %v", err)
	}

	task := asynq.NewTask("distribution-task", payload)
	info, err := c.Enqueue(task, asynq.Queue("highload-sender-queue"), asynq.MaxRetry(0))
	if err != nil {
		log.Fatalf("Failed to enqueue task: %v", err)
	}

	log.Printf("Successfully enqueued task: %s", info.ID)
}

func createHighloadWalletHandler(w http.ResponseWriter, r *http.Request) {
	walletAddress, seedPhrase, err := highload.CreateWallet()
	if err != nil {
		fmt.Println("Error creating wallet:", err.Error())
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	fmt.Println("Wallet address:", walletAddress)

	response := map[string]string{"seed_phrase": seedPhrase, "wallet_address": walletAddress}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		fmt.Println("Error encoding response:", err.Error())
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func withdrawHandler(w http.ResponseWriter, r *http.Request) {
	seedPhrase := r.URL.Query().Get("seed_phrase")
	address := r.URL.Query().Get("address")

	batch := make(map[string]string)
	batch[address] = "0"
	enqueueSendTask(batch, seedPhrase, 128)

	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Data processed successfully")
}

func main() {
	flag.Parse()
	defer c.Close()

	mux := http.NewServeMux()

	mux.Handle("/withdraw", isAuthorizedMiddleware(http.HandlerFunc(withdrawHandler)))
	mux.Handle("/send", isAuthorizedMiddleware(http.HandlerFunc(sendHandler)))
	mux.Handle("/createHighloadWallet", isAuthorizedMiddleware(http.HandlerFunc(createHighloadWalletHandler)))

	port := "9999"
	fmt.Printf("Server is starting at port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
